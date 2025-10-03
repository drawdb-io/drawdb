-- Test SQL file for issue #196: PostgreSQL - Import SQL failed when using custom type with double quotes
-- This file contains the exact SQL from the GitHub issue that was causing the import to fail
-- After applying the fix, this SQL should import successfully in DrawDB

-- Create custom enum type with quoted name
CREATE TYPE "Gender" AS ENUM ('F', 'M', 'U');

-- Create table using the quoted custom type
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "gender" "Gender" NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- Additional test cases with multiple quoted custom types
CREATE TYPE "Status" AS ENUM ('Active', 'Inactive', 'Pending');
CREATE TYPE "UserRole" AS ENUM ('Admin', 'User', 'Guest');

CREATE TABLE "Profiles" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "status" "Status" DEFAULT 'Active',
    "role" "UserRole" DEFAULT 'User',
    "created_at" TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT "Profiles_pkey" PRIMARY KEY ("id"),
    FOREIGN KEY ("user_id") REFERENCES "User"("id")
);

-- Test with mixed quoted and unquoted types
CREATE TABLE "Orders" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "order_status" "Status" DEFAULT 'Pending',
    "amount" DECIMAL(10, 2) NOT NULL,
    "created_at" TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT "Orders_pkey" PRIMARY KEY ("id"),
    FOREIGN KEY ("user_id") REFERENCES "User"("id")
);