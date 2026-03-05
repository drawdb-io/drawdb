-- Sample data for drawDB template1: "Blog database schema"
-- Tables: users, blog_posts, comments, tags, blog_tag

-- USERS
INSERT INTO users (id, username, password, email, last_login) VALUES
  (1, 'alice',  'password123', 'alice@example.com',  '2024-01-10 09:15:00'),
  (2, 'bob',    'hunter2',     'bob@example.com',    '2024-01-12 14:30:00'),
  (3, 'charlie','qwerty!',     'charlie@example.com','2024-01-15 18:05:00');

-- BLOG_POSTS
INSERT INTO blog_posts (id, user_id, title, content, cover) VALUES
  (1, 1, 'Getting started with drawDB',
      'An introduction to modeling your first schema in drawDB.',
      'covers/getting-started.png'),
  (2, 1, 'Advanced ER modeling techniques',
      'How to design flexible, scalable schemas using relationships and constraints.',
      'covers/advanced-er.png'),
  (3, 2, 'Why relational databases still matter',
      'A discussion of strengths of relational databases in modern architectures.',
      'covers/relational-databases.png');

-- COMMENTS
INSERT INTO comments (id, blog_id, user_id, content) VALUES
  (1, 1, 2, 'Great intro, this really helped me understand the basics.'),
  (2, 1, 3, 'Nice walkthrough, especially the part on primary keys.'),
  (3, 2, 3, 'Could you add a section on indexing strategies?'),
  (4, 2, 1, 'Glad you found it useful, I will update the post soon.'),
  (5, 3, 1, 'Interesting perspective, I agree on the trade-offs.'),
  (6, 3, 3, 'Would love to see some benchmark examples here.');

-- TAGS
INSERT INTO tags (id, name) VALUES
  (1, 'database'),
  (2, 'design'),
  (3, 'tutorial'),
  (4, 'performance'),
  (5, 'best-practices');

-- BLOG_TAG (junction table)
INSERT INTO blog_tag (blog_id, tag_id) VALUES
  -- Post 1 tags
  (1, 1),  -- database
  (1, 2),  -- design
  (1, 3),  -- tutorial

  -- Post 2 tags
  (2, 1),  -- database
  (2, 2),  -- design
  (2, 5),  -- best-practices

  -- Post 3 tags
  (3, 1),  -- database
  (3, 4);  -- performance