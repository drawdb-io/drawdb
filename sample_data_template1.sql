-- Sample data for drawDB template1: "Blog database schema"
-- Tables: users, blog_posts, comments, tags, blog_tag

BEGIN TRANSACTION;

INSERT INTO users (id, username, password, email, last_login) VALUES
  (1, 'alice', 'hashed_pw_alice', 'alice@example.com', '2026-03-01 09:00:00'),
  (2, 'bob', 'hashed_pw_bob', 'bob@example.com', '2026-03-03 13:10:00'),
  (3, 'carol', 'hashed_pw_carol', 'carol@example.com', '2026-03-04 18:45:00'),
  (4, 'dan', 'hashed_pw_dan', 'dan@example.com', '2026-03-02 11:20:00'),
  (5, 'eve', 'hashed_pw_eve', 'eve@example.com', '2026-03-05 08:35:00');

INSERT INTO blog_posts (id, user_id, title, content, cover) VALUES
  (1, 1, 'Getting Started With DrawDB', 'A quick setup guide for first-time users.', 'cover_getting_started.png'),
  (2, 2, 'Designing Better Schemas', 'Tips for normalization and relationship design.', 'cover_schema_design.png'),
  (3, 1, 'Importing Existing SQL', 'How to bring your current database into drawDB.', 'cover_import_sql.png'),
  (4, 3, 'PostgreSQL Type Notes', 'Choosing practical data types in Postgres.', 'cover_postgres_types.png'),
  (5, 4, 'Versioning Your ERD', 'Track schema changes with version control.', 'cover_versioning.png'),
  (6, 5, 'Common Modeling Mistakes', 'Frequent mistakes and how to avoid them.', 'cover_mistakes.png');

INSERT INTO comments (id, blog_id, user_id, content) VALUES
  (1, 1, 2, 'Super helpful intro, thanks!'),
  (2, 1, 3, 'Could you add a section on constraints?'),
  (3, 2, 1, 'Great examples on normalization.'),
  (4, 2, 5, 'This saved our team a lot of time.'),
  (5, 3, 4, 'Import flow worked perfectly for me.'),
  (6, 4, 2, 'Nice breakdown of the type tradeoffs.'),
  (7, 5, 3, 'Versioning diagrams is a game changer.'),
  (8, 6, 1, 'The anti-pattern list was spot on.');

INSERT INTO tags (id, name) VALUES
  (1, 'tutorial'),
  (2, 'database-design'),
  (3, 'postgresql'),
  (4, 'productivity'),
  (5, 'best-practices');

INSERT INTO blog_tag (blog_id, tag_id) VALUES
  (1, 1),
  (1, 2),
  (2, 2),
  (2, 5),
  (3, 1),
  (3, 4),
  (4, 3),
  (4, 5),
  (5, 4),
  (5, 2),
  (6, 5),
  (6, 2);

COMMIT;
