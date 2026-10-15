import pg8000.native

def main():
    try:
        conn = pg8000.native.Connection(
            host='185.205.244.119',
            port=5432,
            user='postgres',
            password='d00ca25677d4a26584d38428577bfb86',
            database='postgres'
        )
        print("Connected to PostgreSQL database successfully!")
        version = conn.run("SELECT version();")[0][0]
        print("PostgreSQL Version:", version)

        tables = conn.run("SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;")
        print(f"Public tables count: {len(tables)}")
        for t in tables[:15]:
            print(" -", t[0])
        conn.close()
    except Exception as e:
        print("Connection error:", e)

if __name__ == "__main__":
    main()
