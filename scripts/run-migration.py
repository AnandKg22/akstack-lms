import pg8000.native
import os

def main():
    migration_file = os.path.join(os.path.dirname(__file__), "..", "supabase", "migrations", "20261015000000_multi_course_lms_schema.sql")
    migration_file = os.path.abspath(migration_file)
    print(f"Reading migration file: {migration_file}")

    with open(migration_file, "r", encoding="utf-8") as f:
        sql = f.read()

    conn = pg8000.native.Connection(
        host="185.205.244.119",
        port=5432,
        user="postgres",
        password="d00ca25677d4a26584d38428577bfb86",
        database="postgres"
    )
    print("Connected to PostgreSQL on 185.205.244.119.")

    print("Executing schema migration...")
    conn.run(sql)
    print("Migration executed successfully!")

    # Verify our tables exist
    tables = conn.run("SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'app_akstack_lms_%' ORDER BY tablename;")
    print(f"Verified {len(tables)} app_akstack_lms_* tables:")
    for t in tables:
        print(" [OK]", t[0])

    conn.close()

if __name__ == "__main__":
    main()
