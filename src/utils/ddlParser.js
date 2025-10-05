// universalDdlParser.js
// Universal DDL tokenizer + recursive-descent parser
// Supports extended PostgreSQL DDL: CREATE TABLE/TYPE(INUM)/INDEX/VIEW/SEQUENCE/DOMAIN/COMMENT/ALTER/DROP
// Generates NSP-compatible AST for PostgreSQL (others reuse or adapt)

///// Helpers /////
function getLineCol(sql, pos) {
    const lines = sql.substring(0, pos).split('\n');
    const line = lines.length;
    const col = lines[lines.length - 1].length + 1;
    return { line, col };
}

class ParserError extends Error {
    constructor(sql, pos, expected, found) {
        const { line, col } = getLineCol(sql, pos);
        const msg = `SyntaxError [Ln ${line}, Col ${col}]: Expected ${expected} but ${found} found.`;
        super(msg);
        this.name = 'SyntaxError';
        this.line = line;
        this.col = col;
    }
}

///// Tokenizer /////
function tokenize(sql) {
    // remove single-line and block comments
    sql = sql.replace(/--[^\n\r]*/g, '');
    sql = sql.replace(/\/\*[\s\S]*?\*\//g, '');
    const out = [];
    let i = 0;
    const peek = () => sql[i];
    const next = () => sql[i++];
    const push = (type, val) => out.push({ type, val, pos: i });

    while (i < sql.length) {
        const ch = peek();
        if (/\s/.test(ch)) { next(); continue; }
        if (ch === '"' || ch === '`' || ch === "'") {
            const q = next();
            let buf = '';
            while (peek() && peek() !== q) {
                // support escaped quote by doubling (simple)
                if (peek() === '\\') { next(); if (peek()) buf += next(); continue; }
                buf += next();
            }
            if (peek() === q) next();
            // single quote strings we keep as ID token (value) but mark type as STRING for clarity
            if (q === "'") push('STRING', buf);
            else push('ID', buf);
            continue;
        }
        if (/\d/.test(ch)) {
            let buf = '';
            while (/\d/.test(peek())) buf += next();
            if (peek() === '.' && /\d/.test(sql[i + 1])) {
                buf += next();
                while (/\d/.test(peek())) buf += next();
            }
            push('NUM', buf);
            continue;
        }
        if ('(),;.*[]'.includes(ch)) {
            push(ch, next());
            continue;
        }
        if (/[A-Za-z_]/.test(ch)) {
            let buf = '';
            while (/[A-Za-z0-9_$]/.test(peek())) buf += next();
            buf = normalizeKw(buf);
            push(buf, buf);
            continue;
        }
        // unknown char, skip
        next();
    }
    return { tokens: out, sql };
}

function normalizeKw(kw) {
    const KEYWORDS = new Set(
        'CREATE,ALTER,DROP,TABLE,SCHEMA,INDEX,SEQUENCE,FUNCTION,VIEW,TRIGGER,DOMAIN,TYPE,ENUM,CONSTRAINT,PRIMARY,FOREIGN,KEY,UNIQUE,CHECK,REFERENCES,ON,UPDATE,DELETE,ADD,COLUMN,IF,EXISTS,NOT,NULL,DEFAULT,ASC,DESC,WITH,WITHOUT,SET,RETURNING,AS,AND,OR,XOR,TRUE,FALSE,NOW,CURRENT_TIMESTAMP,CURRENT_DATE,CURRENT_TIME,LOCALTIME,LOCALTIMESTAMP,EXTRACT,YEAR,MONTH,DAY,HOUR,MINUTE,SECOND,TIMEZONE,INTERVAL,CASCADE,RESTRICT,DEFERRABLE,INITIALLY,DEFERRED,IMMEDIATE,ENABLE,DISABLE,VALIDATE,NOVALIDATE,RELY,NORELY,MATCH,FULL,PARTIAL,SIMPLE,USER,CURRENT_USER,SESSION_USER,CURRENT_CATALOG,CURRENT_SCHEMA,ARRAY,JSON,JSONB,UUID,MONEY,NUMERIC,DECIMAL,REAL,DOUBLE,PRECISION,FLOAT,SMALLINT,INTEGER,BIGINT,INT2,INT4,INT8,SERIAL,SERIAL2,SERIAL4,SERIAL8,BIGSERIAL,SMALLSERIAL,VARCHAR,CHARACTER,CHAR,TEXT,BYTEA,BIT,VARYING,VARBIT,TIMESTAMP,TIMESTAMPTZ,TIME,TIMETZ,DATE,BOOLEAN,BOOL,INET,CIDR,MACADDR,TSVECTOR,TSQUERY,XML,POINT,LINE,LSEG,BOX,PATH,POLYGON,CIRCLE,INT4RANGE,INT8RANGE,NUMRANGE,TSRANGE,TSTZRANGE,DATERANGE,LTREE,CITEXT,IPADDRESS,GEOMETRY,GEOGRAPHY,RASTER,REGCLASS,REGTYPE,REGPROC,REGOPER,REGOPERATOR,REGCONFIG,REGDICTIONARY,REGROLE,REGNAMESPACE'
            .split(',')
    );
    return KEYWORDS.has(kw.toUpperCase()) ? kw.toUpperCase() : kw;
}

///// Parser /////
class Parser {
    constructor(tokens, sql) {
        this.t = tokens;
        this.i = 0;
        this.sql = sql;
    }
    peek() { return this.t[this.i]; }
    consume(expected) {
        const cur = this.peek();
        if (!cur) throw new ParserError(this.sql, this.t[this.t.length - 1]?.pos || 0, `"${expected}"`, 'EOF');
        if (expected && cur.type !== expected && cur.val !== expected) {
            throw new ParserError(this.sql, cur.pos, `"${expected}"`, `"${cur.val}"`);
        }
        this.i++;
        return cur;
    }
    parse() {
        const statements = [];
        while (this.peek()) statements.push(this.stmt());
        return statements;
    }
    stmt() {
        const cur = this.consume();
        switch (cur.type) {
            case 'CREATE': return this.createStmt();
            case 'ALTER': return this.alterStmt();
            case 'DROP': return this.dropStmt();
            case 'COMMENT': return this.commentStmt();
            default:
                throw new ParserError(this.sql, cur.pos, `"CREATE" | "ALTER" | "DROP" | "COMMENT"`, `"${cur.val}"`);
        }
    }

    /* ---------- CREATE ---------- */
    createStmt() {
        // next token indicates what: TABLE | TYPE | INDEX | VIEW | SEQUENCE | SCHEMA | DOMAIN | MATERIALIZED
        const what = this.consume().type;
        const ifNot = this.optional('IF') && (this.consume('NOT'), this.consume('EXISTS'), true);
        // name may be identifier or schema-qualified (we keep as simple id for now)
        const name = this.id();
        let rest = {};

        // dispatch per object
        if (what === 'TABLE') rest = this.createTableTail(name);
        else if (what === 'TYPE') rest = this.createTypeTail(name);
        else if (what === 'INDEX') rest = this.createIndexTail(name);
        else if (what === 'VIEW') rest = this.createViewTail(name, { materialized: false });
        else if (what === 'MATERIALIZED') {
            // CREATE MATERIALIZED VIEW name AS ...
            this.consume('VIEW');
            rest = this.createViewTail(name, { materialized: true });
        } else if (what === 'SEQUENCE') rest = this.createSequenceTail(name);
        else if (what === 'SCHEMA') rest = {}; // create schema name
        else if (what === 'DOMAIN') rest = this.createDomainTail(name);
        else {
            // fallback: skip to semicolon/terminator and put body
            rest = { body: this.skipToTerminator() };
        }

        this.optional(';');
        return { type: 'CREATE', what, name, ifNot, ...rest };
    }

    createTableTail(name) {
        // expects ( ... ) for columns and table constraints
        this.consume('(');
        const columns = [], constraints = [];
        do {
            if (this.peek().val === ',' && columns.length) { this.consume(','); continue; }
            if (this.isConstraintStart()) constraints.push(this.constraint());
            else columns.push(this.columnDef());
        } while (!this.optional(')'));
        return { columns, constraints };
    }

    createTypeTail(name) {
        // supports: AS ENUM ('a','b', ...)
        if (this.optional('AS')) {
            if (this.optional('ENUM')) {
                this.consume('(');
                const values = [];
                while (!this.optional(')')) {
                    const vtoken = this.consume();
                    if (vtoken.type !== 'STRING' && vtoken.type !== 'ID') {
                        throw new ParserError(this.sql, vtoken.pos, 'string', `"${vtoken.val}"`);
                    }
                    values.push(vtoken.val);
                    this.optional(',');
                }
                return { kind: 'ENUM', values };
            }
        }
        // fallback: body
        return { body: this.skipToTerminator() };
    }

    createIndexTail(name) {
        // optionally UNIQUE
        let unique = false;
        // name already consumed, we expect maybe UNIQUE before ON in some dialects
        // if the token we consumed as 'name' was actually UNIQUE we would have consumed UNIQUE as name; keep simple: allow UNIQUE keyword here
        const prev = this.peek();
        if (prev && prev.type === 'UNIQUE') { unique = true; this.consume('UNIQUE'); }
        // syntaxes: ON table (col, ...)
        if (this.optional('ON')) {
            const table = this.id();
            this.consume('(');
            const columns = this.idList();
            this.consume(')');
            return { unique, table, columns };
        }
        // fallback: body
        return { body: this.skipToTerminator() };
    }

    createViewTail(name, opts = {}) {
        // CREATE [MATERIALIZED] VIEW name AS <select>
        if (this.optional('AS')) {
            const body = this.skipToTerminator();
            return { kind: 'VIEW', body, materialized: !!opts.materialized };
        }
        return { body: null, materialized: !!opts.materialized };
    }

    createSequenceTail(name) {
        // consume optional sequence options until terminator or comma
        const options = {};
        while (this.peek() && this.peek().type !== ';') {
            // simple accepts key NUM patterns
            const cur = this.peek();
            if (cur.type === 'INCREMENT') { this.consume('INCREMENT'); this.optional('BY'); options.increment = this.consume('NUM').val; }
            else if (cur.type === 'START') { this.consume('START'); this.optional('WITH'); options.start = this.consume('NUM').val; }
            else if (cur.type === 'MINVALUE') { this.consume('MINVALUE'); options.min = this.consume('NUM').val; }
            else if (cur.type === 'MAXVALUE') { this.consume('MAXVALUE'); options.max = this.consume('NUM').val; }
            else if (cur.type === 'CYCLE') { this.consume('CYCLE'); options.cycle = true; }
            else break;
        }
        return { kind: 'SEQUENCE', options };
    }

    createDomainTail(name) {
        // CREATE DOMAIN name AS dataType [constraints...]
        const dataType = this.dataType();
        const constraints = [];
        while (this.isColConstraint()) constraints.push(this.colConstraint());
        return { kind: 'DOMAIN', dataType, constraints };
    }

    /* ---------- ALTER ---------- */
    alterStmt() {
        const what = this.consume().type; // e.g., TABLE | SEQUENCE | TYPE etc
        const name = this.id();
        const actions = [];
        do {
            if (this.optional('ADD')) {
                if (this.isConstraintStart()) actions.push({ action: 'ADD_CONSTRAINT', constraint: this.constraint() });
                else if (this.optional('COLUMN')) actions.push({ action: 'ADD_COLUMN', column: this.columnDef() });
                else if (this.optional('CONSTRAINT')) {
                    // named constraint add
                    const c = this.constraint();
                    actions.push({ action: 'ADD_CONSTRAINT', constraint: c });
                } else actions.push({ action: 'ADD', body: this.skipToTerminator() });
            } else if (this.optional('DROP')) {
                this.optional('COLUMN');
                const maybeName = this.id();
                actions.push({ action: 'DROP_COLUMN', name: maybeName });
            } else if (this.optional('RENAME')) {
                // RENAME TO <name>
                if (this.optional('TO')) {
                    const toName = this.id();
                    actions.push({ action: 'RENAME_TO', name: toName });
                } else actions.push({ action: 'RENAME', body: this.skipToTerminator() });
            } else break;
        } while (this.optional(','));
        this.optional(';');
        return { type: 'ALTER', what, name, actions };
    }

    /* ---------- DROP ---------- */
    dropStmt() {
        const what = this.consume().type;
        const ifExists = this.optional('IF') && (this.consume('EXISTS'), true);
        const name = this.id();
        this.optional(';');
        return { type: 'DROP', what, name, ifExists };
    }

    /* ---------- COMMENT ---------- */
    commentStmt() {
        // COMMENT ON <object> <name> IS '...'
        this.consume('ON');
        const objectType = this.consume().type; // TABLE | COLUMN | VIEW | SEQUENCE ...
        const name = this.id();
        // for column comments: name could be like table.column but we keep simple
        if (this.optional('IS')) {
            const valToken = this.consume();
            if (valToken.type !== 'STRING') {
                throw new ParserError(this.sql, valToken.pos, 'string', `"${valToken.val}"`);
            }
            this.optional(';');
            return { type: 'COMMENT', objectType, name, value: valToken.val };
        }
        throw new ParserError(this.sql, this.peek()?.pos || 0, '"IS"', `"${this.peek()?.val}"`);
    }

    /* ---------- column / constraints / types ---------- */
    columnDef() {
        const name = this.id();
        const dataType = this.dataType();
        const constraints = [];
        while (this.isColConstraint()) constraints.push(this.colConstraint());
        return { name, dataType, constraints };
    }

    dataType() {
        const t = this.consume();
        let name = t.val;
        let lenPart = '';

        // SERIAL types are automatically treated as integer + auto_increment
        const serialMap = { 'SERIAL': 'INT', 'SMALLSERIAL': 'SMALLINT', 'BIGSERIAL': 'BIGINT' };
        let autoInc = false;
        if (serialMap[name.toUpperCase()]) {
            autoInc = true;
            name = serialMap[name.toUpperCase()];
        }

        if (this.optional('(')) {
            const len = this.consume('NUM').val;
            let scale = null;
            if (this.optional(',')) scale = this.consume('NUM').val;
            this.consume(')');
            lenPart = `(${len}${scale !== null ? ',' + scale : ''})`;
        }

        while (this.optional('[') && this.optional(']')) lenPart += '[]';
        const fullType = name + lenPart;
        return autoInc ? { type: fullType, auto_increment: true } : fullType;
    }

    colConstraint() {
        if (this.optional('NOT')) { this.consume('NULL'); return { type: 'NOT_NULL' }; }
        if (this.optional('NULL')) return { type: 'NULL' };
        if (this.optional('UNIQUE')) return { type: 'UNIQUE' };
        if (this.optional('PRIMARY')) { this.consume('KEY'); return { type: 'PRIMARY' }; }
        if (this.optional('DEFAULT')) {
            const v = this.defaultValue();
            return { type: 'DEFAULT', value: v };
        }
        if (this.optional('REFERENCES')) {
            const table = this.id();
            this.consume('(');
            const col = this.id();
            this.consume(')');
            const { onUpdate, onDelete } = this.onActions();
            return { type: 'FK_INLINE', table, column: col, onUpdate, onDelete };
        }
        throw new ParserError(this.sql, this.peek().pos, '"NOT" | "NULL" | "UNIQUE" | "PRIMARY" | "DEFAULT" | "REFERENCES"', `"${this.peek().val}"`);
    }

    constraint() {
        let name;
        if (this.optional('CONSTRAINT')) name = this.id();
        if (this.optional('PRIMARY')) {
            this.consume('KEY');
            this.consume('(');
            const cols = this.idList();
            this.consume(')');
            return { type: 'PK', name, columns: cols };
        }
        if (this.optional('UNIQUE')) {
            this.consume('(');
            const cols = this.idList();
            this.consume(')');
            return { type: 'UNIQUE', name, columns: cols };
        }
        if (this.optional('FOREIGN')) {
            this.consume('KEY');
            this.consume('(');
            const cols = this.idList();
            this.consume(')');
            this.consume('REFERENCES');
            const refTable = this.id();
            this.consume('(');
            const refCols = this.idList();
            this.consume(')');
            const { onUpdate, onDelete } = this.onActions();
            return { type: 'FK', name, columns: cols, refTable, refColumns: refCols, onUpdate, onDelete };
        }
        if (this.optional('CHECK')) {
            const body = this.skipToTerminator();
            return { type: 'CHECK', name, body };
        }
        throw new ParserError(this.sql, this.peek().pos, '"PRIMARY" | "UNIQUE" | "FOREIGN" | "CHECK"', `"${this.peek().val}"`);
    }

    onActions() {
        let onUpdate, onDelete;
        while (this.peek() && this.peek().type === 'ON') {
            this.consume('ON');
            const evt = this.consume().type;
            const act = this.action();
            if (evt === 'UPDATE') onUpdate = act;
            if (evt === 'DELETE') onDelete = act;
        }
        return { onUpdate, onDelete };
    }

    action() {
        if (this.optional('NO')) { this.consume('ACTION'); return 'NO ACTION'; }
        if (this.optional('CASCADE')) return 'CASCADE';
        if (this.optional('SET')) {
            if (this.optional('NULL')) return 'SET NULL';
            if (this.optional('DEFAULT')) return 'SET DEFAULT';
        }
        if (this.optional('RESTRICT')) return 'RESTRICT';
        throw new ParserError(this.sql, this.peek().pos, '"NO ACTION" | "CASCADE" | "SET NULL" | "SET DEFAULT" | "RESTRICT"', `"${this.peek().val}"`);
    }

    defaultValue() {
        const cur = this.peek();
        if (!cur) throw new ParserError(this.sql, 0, 'value', 'EOF');
        if (cur.type === 'NUM') return this.consume().val;
        if (cur.type === 'STRING') return this.consume().val;
        if (cur.type === 'TRUE' || cur.type === 'FALSE') return this.consume().type === 'TRUE';
        if (cur.type === 'NOW()' || cur.type === 'CURRENT_TIMESTAMP') {
            this.consume();
            return 'CURRENT_TIMESTAMP';
        }
        // fallback: expression
        return this.skipToTerminator();
    }

    id() {
        const t = this.consume();
        // identifiers may be ID or keyword treated as identifier
        if (t.type === 'ID' || t.type === 'STRING') return t.val;
        return t.val;
    }

    idList() {
        const list = [this.id()];
        while (this.optional(',')) list.push(this.id());
        return list;
    }

    optional(tok) {
        const cur = this.peek();
        if (!cur) return false;
        if (cur.type === tok || cur.val === tok) {
            this.i++;
            return true;
        }
        return false;
    }

    isConstraintStart() {
        const p = this.peek();
        return p && ['CONSTRAINT', 'PRIMARY', 'UNIQUE', 'FOREIGN', 'CHECK'].includes(p.type);
    }

    isColConstraint() {
        const p = this.peek();
        return p && ['NOT', 'NULL', 'UNIQUE', 'PRIMARY', 'DEFAULT', 'REFERENCES'].includes(p.type);
    }

    skipToTerminator() {
        let depth = 0, buf = '';
        while (this.peek()) {
            const t = this.peek();
            if (t.val === '(') { depth++; buf += t.val; this.consume(); continue; }
            if (t.val === ')') {
                if (depth === 0) break;
                depth--; buf += t.val; this.consume(); continue;
            }
            if (depth === 0 && (t.val === ',' || t.type === ';')) break;
            buf += (t.val ?? t.type) + ' ';
            this.consume();
        }
        return buf.trim();
    }
}

///// Raw parse entry /////
function rawParse(sql) {
    const { tokens, sql: originalSql } = tokenize(sql);
    const parser = new Parser(tokens, originalSql);
    const stmts = parser.parse();

    const tables = [];
    const relationships = [];
    const enums = [];
    const views = [];
    const indexes = [];
    const sequences = [];
    const domains = [];
    const comments = [];

    for (const s of stmts) {
        if (s.type === 'CREATE') {
            switch (s.what) {
                case 'TABLE':
                    tables.push({ name: s.name, columns: s.columns, constraints: s.constraints || [] });
                    for (const c of s.constraints || []) {
                        if (c.type === 'FK') {
                            relationships.push({
                                table: s.name,
                                columns: c.columns,
                                refTable: c.refTable,
                                refColumns: c.refColumns,
                                onUpdate: c.onUpdate || 'NO ACTION',
                                onDelete: c.onDelete || 'NO ACTION',
                            });
                        }
                    }
                    break;
                case 'TYPE':
                    if (s.kind === 'ENUM' || s.values) enums.push({ name: s.name, values: s.values || s.values });
                    break;
                case 'INDEX':
                    indexes.push({ name: s.name, unique: s.unique || false, table: s.table, columns: s.columns });
                    break;
                case 'VIEW':
                    views.push({ name: s.name, body: s.body, materialized: s.materialized || false });
                    break;
                case 'SEQUENCE':
                    sequences.push({ name: s.name, options: s.options || s.options });
                    break;
                case 'DOMAIN':
                    domains.push({ name: s.name, dataType: s.dataType, constraints: s.constraints || [] });
                    break;
                default:
                    break;
            }
        } else if (s.type === 'ALTER') {
            if (s.what === 'TABLE') {
                const tbl = tables.find(t => t.name === s.name);
                if (!tbl) continue;
                for (const a of s.actions) {
                    // FK dari ALTER langsung gabung ke constraints tabel
                    if (a.action === 'ADD_CONSTRAINT' && a.constraint.type === 'FK') {
                        const c = a.constraint;
                        tbl.constraints.push(c);
                        relationships.push({
                            table: tbl.name,
                            columns: c.columns,
                            refTable: c.refTable,
                            refColumns: c.refColumns,
                            onUpdate: c.onUpdate || 'NO ACTION',
                            onDelete: c.onDelete || 'NO ACTION',
                        });
                    }
                    // ADD_COLUMN langsung gabung ke columns tabel
                    if (a.action === 'ADD_COLUMN' && a.column) {
                        tbl.columns.push(a.column);
                    }
                }
            }
        } else if (s.type === 'DROP') {
            // bisa diperluas untuk DROP
        } else if (s.type === 'COMMENT') {
            comments.push({ objectType: s.objectType, name: s.name, value: s.value });
        }
    }

    return { tables, relationships, enums, views, indexes, sequences, domains, comments };
}

// dispatcher exposed via toAst()
export function toAst(database = 'PostgreSQL') {
    const udpTables = this.tables;
    const udpRels = this.relationships;
    database = (database || 'PostgreSQL').toLowerCase();
    if (database === 'oraclesql') database = 'oracle';
    if (database === 'mariadb') database = 'mysql';
    if (database === 'transactsql') database = 'mssql';

    switch (database) {
        case 'postgresql': return toPostgreSQLAst.call(this);
        case 'oracle': return toOracleAst.call(this);
        case 'mysql': return toMySQLAst.call(this);
        case 'mssql': return toMssqlAst.call(this);
        default: throw new Error(`Unsupported database dialect: ${database}`);
    }
}

/* ---------- PostgreSQL AST (NSP-like) ---------- */
// ==================================================================
// PostgreSQL AST generator (kompatibel penuh dengan fromPostgres())
// Dipanggil via: parseSQL(source).toAst("postgres")
// ==================================================================
function toPostgreSQLAst() {
    const createNodes = [];

    for (const tbl of (this.tables || [])) {
        const create_definitions = [];

        // ======== COLUMN DEFINITIONS ========
        for (const col of (tbl.columns || [])) {
            const def = {
                resource: "column",
                column: { column: { expr: { value: col.name } } },
                definition: { dataType: dataTypeToString(col.dataType) },
            };

            for (const c of (col.constraints || [])) {
                switch (c.type) {
                    case "PRIMARY":
                    case "PK":
                        def.primary_key = true;
                        def.nullable = false;
                        break;
                    case "NOT_NULL":
                        def.nullable = true;
                        break;
                    case "UNIQUE":
                        def.unique = true;
                        break;
                    case "AUTO_INCREMENT":
                        def.auto_increment = true;
                        break;
                }
            }

            create_definitions.push(def);

            // ======== FK INLINE ========
            for (const c of (col.constraints || [])) {
                if (c.type === "FK_INLINE") {
                    create_definitions.push({
                        resource: "constraint",
                        constraint_type: "foreign key",
                        definition: [{ column: { expr: { value: col.name } } }],
                        reference_definition: {
                            table: [{ table: c.table || c.refTable }],
                            definition: [{ column: { expr: { value: c.column || c.refColumns?.[0] } } }],
                            on_action: [
                                ...(c.onUpdate ? [{ type: "on update", value: { value: c.onUpdate } }] : []),
                                ...(c.onDelete ? [{ type: "on delete", value: { value: c.onDelete } }] : []),
                            ],
                        },
                    });
                }
            }
        }

        // ======== TABLE-LEVEL CONSTRAINTS ========
        for (const c of (tbl.constraints || [])) {
            if (!c) continue;
            if (["PK", "PRIMARY"].includes(c.type)) {
                create_definitions.push({
                    resource: "constraint",
                    constraint_type: "primary key",
                    definition: (c.columns || []).map(col => ({ column: { expr: { value: col } } })),
                });
            } else if (c.type === "UNIQUE") {
                create_definitions.push({
                    resource: "constraint",
                    constraint_type: "unique",
                    definition: (c.columns || []).map(col => ({ column: { expr: { value: col } } })),
                });
            } else if (c.type === "CHECK") {
                create_definitions.push({
                    resource: "constraint",
                    constraint_type: "check",
                    definition: [{ column: { expr: { value: c.body || "" } } }],
                });
            } else if (c.type === "FK") {
                // FK table-level
                create_definitions.push({
                    resource: "constraint",
                    constraint_type: "foreign key",
                    definition: (c.columns || []).map(col => ({ column: { expr: { value: col } } })),
                    reference_definition: {
                        table: [{ table: c.refTable }],
                        definition: (c.refColumns || []).map(col => ({ column: { expr: { value: col } } })),
                        on_action: [
                            ...(c.onUpdate ? [{ type: "on update", value: { value: c.onUpdate } }] : []),
                            ...(c.onDelete ? [{ type: "on delete", value: { value: c.onDelete } }] : []),
                        ],
                    },
                });
            }
        }

        createNodes.push({
            type: "create",
            keyword: "table",
            table: [{ table: tbl.name }],
            create_definitions,
        });
    }

    // ======== ALTER TABLE ========
    for (const tbl of (this.tables || [])) {
        if (!tbl.alters) continue;
        for (const a of tbl.alters) {
            const exprNode = { action: a.action };

            if (a.action === "ADD_CONSTRAINT" && a.constraint) {
                const c = a.constraint;
                exprNode.create_definitions = {
                    resource: "constraint",
                    constraint_type: c.type === "PK" ? "primary key" :
                        c.type === "UNIQUE" ? "unique" :
                            c.type === "FK" ? "foreign key" : c.type.toLowerCase(),
                    definition: (c.columns || []).map(col => ({ column: { expr: { value: col } } })),
                    reference_definition: c.refTable ? {
                        table: [{ table: c.refTable }],
                        definition: (c.refColumns || []).map(col => ({ column: { expr: { value: col } } })),
                        on_action: [
                            ...(c.onUpdate ? [{ type: "on update", value: { value: c.onUpdate } }] : []),
                            ...(c.onDelete ? [{ type: "on delete", value: { value: c.onDelete } }] : []),
                        ],
                    } : undefined,
                };
            }

            createNodes.push({
                type: "alter",
                table: [{ table: tbl.name }],
                expr: [exprNode],
            });
        }
    }

    // ======== ENUMS ========
    for (const e of (this.enums || [])) {
        createNodes.push({
            type: "create",
            keyword: "type",
            resource: "enum",
            name: { name: e.name },
            create_definitions: { value: (e.values || []).map(v => ({ value: v })) },
        });
    }

    // ======== INDEXES ========
    for (const idx of (this.indexes || [])) {
        createNodes.push({
            type: "create",
            keyword: "index",
            index: idx.name,
            index_type: idx.unique ? "unique" : null,
            table: { table: idx.table },
            index_columns: (idx.columns || []).map(c => ({ column: { expr: { value: c } } })),
        });
    }

    // ======== VIEWS ========
    for (const v of (this.views || [])) {
        createNodes.push({
            type: "create",
            keyword: "view",
            name: { name: v.name },
            body: v.body || null,
            materialized: !!v.materialized,
        });
    }

    // ======== SEQUENCES ========
    for (const s of (this.sequences || [])) {
        createNodes.push({
            type: "create",
            keyword: "sequence",
            name: { name: s.name },
            options: s.options || {},
        });
    }

    // ======== DOMAINS ========
    for (const d of (this.domains || [])) {
        createNodes.push({
            type: "create",
            keyword: "domain",
            name: { name: d.name },
            definition: { dataType: d.dataType, constraints: d.constraints || [] },
        });
    }

    // ======== COMMENTS ========
    for (const c of (this.comments || [])) {
        createNodes.push({ type: "comment", object: c.objectType, name: c.name, value: c.value });
    }

    return createNodes;
}


/* ---------- Oracle AST generator ---------- */
function toOracleAst() {
    const udpTables = this.tables;
    const udpRels = this.relationships;

    const tableList = [];
    const columnList = [];

    const createNodes = udpTables.map(tbl => {
        tableList.push(`create::${tbl.name}`);

        const relational_properties = tbl.columns.map(col => {
            columnList.push(`create::${tbl.name}.${col.name}`);

            const constraints = [];
            if (col.constraints.some(c => c.type === 'PRIMARY')) {
                constraints.push({
                    resource: 'constraint',
                    name: null,
                    constraint: { primary_key: 'primary key' },
                    state: null,
                });
            }
            if (col.constraints.some(c => c.type === 'NOT_NULL')) {
                constraints.push({
                    resource: 'constraint',
                    name: null,
                    constraint: { not_null: 'not null' },
                    state: null,
                });
            }
            if (col.constraints.some(c => c.type === 'UNIQUE')) {
                constraints.push({
                    resource: 'constraint',
                    name: null,
                    constraint: { unique: 'unique' },
                    state: null,
                });
            }

            const fk = col.constraints.find(c => c.type === 'FK_INLINE');
            if (fk) {
                constraints.push({
                    resource: 'constraint',
                    name: null,
                    constraint: {
                        type: 'reference',
                        object: { schema: null, name: fk.table },
                        columns: [fk.column],
                        on_delete: null,
                    },
                    state: null,
                });
            }

            const typeNode = parseOracleType(col.dataType);

            return {
                name: col.name,
                type: typeNode,
                sort: null,
                encrypt: null,
                collate: null,
                visibility: null,
                constraints,
                resource: 'column',
            };
        });

        return {
            name: { schema: null, name: tbl.name },
            type: null,
            table: {
                collation: null,
                on_commit_rows: null,
                table_properties: null,
                immutable_clauses: { no_drop_clause: null, no_delete_clause: null },
                blockchain_clauses: null,
                physical_properties: null,
                on_commit_definition: null,
                relational_properties,
            },
            object: 'table',
            parent: null,
            sharing: null,
            operation: 'create',
            memoptimize_for: null,
        };
    });
    return createNodes;
}

/* ---------- MySQL & MSSQL placeholders (reuse PG for now) ---------- */
function toMySQLAst() {
    const createNodes = [];

    for (const tbl of (this.tables || [])) {
        const create_definitions = [];

        // ======== COLUMN DEFINITIONS ========
        for (const col of (tbl.columns || [])) {
            const def = {
                resource: "column",
                column: { column: col.name },
                definition: { dataType: (col.dataType || "").toUpperCase() },
                nullable: !(col.constraints?.some(c => c.type === "NOT_NULL")),
                unique: col.constraints?.some(c => c.type === "UNIQUE") || false,
                primary_key: col.constraints?.some(c => c.type === "PRIMARY") || false,
                auto_increment: col.constraints?.some(c => c.type === "AUTO_INCREMENT") || false,
                default_val: col.constraints?.find(c => c.type === "DEFAULT")?.value || null,
                check: col.constraints?.find(c => c.type === "CHECK")?.body || null,
            };

            create_definitions.push(def);

            // ======== FK INLINE ========
            for (const c of (col.constraints || [])) {
                if (c.type === "FK_INLINE") {
                    create_definitions.push({
                        resource: "constraint",
                        constraint_type: "foreign key",
                        definition: [{ column: col.name }],
                        reference_definition: {
                            table: [{ table: c.table || c.refTable }],
                            definition: [{ column: c.column || c.refColumns?.[0] }],
                            on_action: [
                                ...(c.onUpdate ? [{ type: "on update", value: { value: c.onUpdate } }] : []),
                                ...(c.onDelete ? [{ type: "on delete", value: { value: c.onDelete } }] : []),
                            ],
                        },
                    });
                }
            }
        }

        // ======== TABLE-LEVEL CONSTRAINTS ========
        for (const c of (tbl.constraints || [])) {
            if (!c) continue;
            if (["PK", "PRIMARY"].includes(c.type)) {
                create_definitions.push({
                    resource: "constraint",
                    constraint_type: "primary key",
                    definition: (c.columns || []).map(col => ({ column: col })),
                });
            } else if (c.type === "UNIQUE") {
                create_definitions.push({
                    resource: "constraint",
                    constraint_type: "unique",
                    definition: (c.columns || []).map(col => ({ column: col })),
                });
            } else if (c.type === "CHECK") {
                create_definitions.push({
                    resource: "constraint",
                    constraint_type: "check",
                    definition: [{ column: c.body || "" }],
                });
            } else if (c.type === "FK") {
                create_definitions.push({
                    resource: "constraint",
                    constraint_type: "foreign key",
                    definition: (c.columns || []).map(col => ({ column: col })),
                    reference_definition: {
                        table: [{ table: c.refTable }],
                        definition: (c.refColumns || []).map(col => ({ column: col })),
                        on_action: [
                            ...(c.onUpdate ? [{ type: "on update", value: { value: c.onUpdate } }] : []),
                            ...(c.onDelete ? [{ type: "on delete", value: { value: c.onDelete } }] : []),
                        ],
                    },
                });
            }
        }

        createNodes.push({
            type: "create",
            keyword: "table",
            table: [{ table: tbl.name }],
            create_definitions,
        });

        // ======== INDEXES ========
        for (const idx of (tbl.indices || [])) {
            createNodes.push({
                type: "create",
                keyword: "index",
                index: idx.name,
                index_type: idx.unique ? "unique" : null,
                table: { table: tbl.name },
                index_columns: (idx.fields || []).map(f => ({ column: f.name })),
            });
        }
    }

    // ======== ENUMS ========
    for (const e of (this.enums || [])) {
        createNodes.push({
            type: "create",
            keyword: "type",
            resource: "enum",
            name: { name: e.name },
            create_definitions: { value: (e.values || []).map(v => ({ value: v })) },
        });
    }

    return createNodes;
}


function toMssqlAst() {
}

/* ---------- utility: parse type strings to small type nodes ---------- */
function parsePostgreSQLType(str) {
    const m = String(str || '').match(/^([A-Z]+)(?:\((\d+)(?:,(\d+))?\))?/i);
    const base = (m?.[1] || '').toUpperCase();
    const p = m?.[2] ? parseInt(m[2]) : null;
    const s = m?.[3] ? parseInt(m[3]) : null;

    switch (base) {
        case 'INTEGER': return { type: 'integer' };
        case 'INT': return { type: 'integer' };
        case 'VARCHAR': return { type: 'varchar', size: p || 255 };
        case 'CHARACTER': return { type: 'char', size: p || null };
        case 'DATE': return { type: 'date' };
        case 'NUMERIC': return { type: 'numeric', precision: p || 15, scale: s || 2 };
        case 'TIMESTAMP': return { type: 'timestamp', fractional_seconds_precision: null, with_tz: null };
        default: return { type: base ? base.toLowerCase() : 'text' };
    }
}
function dataTypeToString(dt) {
    if (!dt) return '';
    if (typeof dt === 'string') return dt;
    if (dt.type) return dt.type.toUpperCase();
    return '';
}
function parseOracleType(str) {
    const m = String(str || '').match(/^([A-Z]+)(?:\((\d+)(?:,(\d+))?\))?/i);
    const base = (m?.[1] || '').toUpperCase();
    const p = m?.[2] ? parseInt(m[2]) : null;
    const s = m?.[3] ? parseInt(m[3]) : null;

    switch (base) {
        case 'NUMBER': return { type: 'number', precision: p, scale: s };
        case 'VARCHAR2': return { type: 'varchar2', size: p };
        case 'CHAR': return { type: 'char', size: p };
        case 'DATE': return { type: 'date' };
        case 'TIMESTAMP': return { type: 'timestamp' };
        default: return { type: base.toLowerCase() };
    }
}


///// Public API /////
export function parseSQL(sql) {
    const parsed = rawParse(sql);
    const result = { ...parsed };
    // attach toAst bound to the parsed result (so callers can call result.toAst('PostgreSQL'))
    result.toAst = toAst.bind(result);
    return result;
}

/* ---------- Usage:
import { parseSQL } from './universalDdlParser.js';
const res = parseSQL(`CREATE TABLE users (id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL, role VARCHAR(10)); CREATE TYPE mood AS ENUM ('happy','sad'); CREATE INDEX idx_users_name ON users (name);`);
console.log(res.tables, res.enums, res.indexes);
const ast = res.toAst('PostgreSQL'); // NSP-compatible AST array
console.log(JSON.stringify(ast, null, 2));
*/
