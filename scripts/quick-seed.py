import pg8000.native
import sys

def main():
    print("Connecting...", flush=True)
    conn = pg8000.native.Connection(
        host="185.205.244.119",
        port=5432,
        user="postgres",
        password="d00ca25677d4a26584d38428577bfb86",
        database="postgres"
    )
    print("Connected!", flush=True)

    # 1. Check existing courses
    courses = conn.run("SELECT id, title, slug FROM public.app_akstack_lms_courses;")
    print("Existing courses:", courses, flush=True)

    if not courses:
        conn.run("""
            INSERT INTO public.app_akstack_lms_courses (slug, title, description, price_cents, currency, is_published)
            VALUES ('gtm-engineering-90-day-challenge', 'GTM Engineering 90-Day Challenge', 'Enterprise curriculum transforming software engineers into high-leverage Go-To-Market and Platform Architects.', 9700, 'USD', true);
        """)
        courses = conn.run("SELECT id, title, slug FROM public.app_akstack_lms_courses;")
        print("Created course:", courses, flush=True)

    course_id = courses[0][0]

    # 2. Modules
    modules = [
        "Phase 1: Foundations & Architecture",
        "Phase 2: Core Data Pipelines",
        "Phase 3: Auth & Identity Infrastructure",
        "Phase 4: Telemetry & Observability",
        "Phase 5: Payments & Entitlement Engines",
        "Phase 6: Admin Studios & Content CMS",
        "Phase 7: Developer Tooling & SDKs",
        "Phase 8: High-Scale Reliability",
        "Phase 9: Production Capstone & Enterprise Launch",
    ]

    for idx, m_title in enumerate(modules, start=1):
        existing = conn.run(f"SELECT id FROM public.app_akstack_lms_modules WHERE course_id = '{course_id}' AND title = '{m_title}';")
        if not existing:
            conn.run(f"INSERT INTO public.app_akstack_lms_modules (course_id, title, order_index) VALUES ('{course_id}', '{m_title}', {idx});")
    
    db_modules = conn.run(f"SELECT id, title, order_index FROM public.app_akstack_lms_modules WHERE course_id = '{course_id}' ORDER BY order_index;")
    print(f"Total modules in DB: {len(db_modules)}", flush=True)

    # 3. Quick sample lessons (1 per module to test)
    for m in db_modules:
        m_id, m_title, m_idx = m[0], m[1], m[2]
        l_slug = f"module-{m_idx}-day-1"
        l_title = f"{m_title} - Day 1 Introduction"
        conn.run(f"""
            INSERT INTO public.app_akstack_lms_lessons (module_id, title, slug, content, order_index, is_preview)
            VALUES ('{m_id}', '{l_title}', '{l_slug}', '# {l_title}\\n\\nWelcome to {m_title}.', 1, true)
            ON CONFLICT (module_id, slug) DO NOTHING;
        """)

    total_lessons = conn.run("SELECT count(*) FROM public.app_akstack_lms_lessons;")[0][0]
    print(f"Total lessons in DB: {total_lessons}", flush=True)

    conn.close()
    print("Done!", flush=True)

if __name__ == "__main__":
    main()
