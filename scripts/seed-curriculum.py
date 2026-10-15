import pg8000.native
import json
import re

def slugify(text: str) -> str:
    text = text.lower()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'\s+', '-', text)
    text = re.sub(r'--+', '-', text)
    return text.strip()

def get_phase_name(day: int) -> str:
    if day <= 10: return "Phase 1: Foundations & Architecture"
    if day <= 20: return "Phase 2: Core Data Pipelines"
    if day <= 30: return "Phase 3: Auth & Identity Infrastructure"
    if day <= 40: return "Phase 4: Telemetry & Observability"
    if day <= 50: return "Phase 5: Payments & Entitlement Engines"
    if day <= 60: return "Phase 6: Admin Studios & Content CMS"
    if day <= 70: return "Phase 7: Developer Tooling & SDKs"
    if day <= 80: return "Phase 8: High-Scale Reliability"
    return "Phase 9: Production Capstone & Enterprise Launch"

def main():
    conn = pg8000.native.Connection(
        host="185.205.244.119",
        port=5432,
        user="postgres",
        password="d00ca25677d4a26584d38428577bfb86",
        database="postgres"
    )
    print("Connected to PostgreSQL for curriculum seeding.")

    course_title = "GTM Engineering 90-Day Challenge"
    course_slug = "gtm-engineering-90-day-challenge"
    course_desc = "Enterprise curriculum transforming software engineers into high-leverage Go-To-Market and Platform Architects."
    price_cents = 9700

    # 1. Upsert Course
    res = conn.run(
        """
        INSERT INTO public.app_akstack_lms_courses (slug, title, description, price_cents, currency, is_published)
        VALUES (:slug, :title, :desc, :price, 'USD', true)
        ON CONFLICT (slug) DO UPDATE
        SET title = EXCLUDED.title, description = EXCLUDED.description, price_cents = EXCLUDED.price_cents, is_published = true
        RETURNING id;
        """,
        slug=course_slug,
        title=course_title,
        desc=course_desc,
        price=price_cents
    )
    course_id = res[0][0]
    print(f"Course upserted with ID: {course_id}")

    # 2. Seed 9 Modules and 90 Lessons
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

    module_ids = {}
    for idx, mod_title in enumerate(modules, start=1):
        m_res = conn.run(
            """
            SELECT id FROM public.app_akstack_lms_modules
            WHERE course_id = :cid AND title = :title;
            """,
            cid=course_id,
            title=mod_title
        )
        if m_res:
            m_id = m_res[0][0]
            conn.run(
                "UPDATE public.app_akstack_lms_modules SET order_index = :idx WHERE id = :mid;",
                idx=idx,
                mid=m_id
            )
        else:
            m_res = conn.run(
                """
                INSERT INTO public.app_akstack_lms_modules (course_id, title, order_index)
                VALUES (:cid, :title, :idx)
                RETURNING id;
                """,
                cid=course_id,
                title=mod_title,
                idx=idx
            )
            m_id = m_res[0][0]
        module_ids[mod_title] = m_id

    print(f"Upserted {len(module_ids)} modules.")

    # 3. Seed Lessons
    lesson_count = 0
    for day in range(1, 91):
        phase_title = get_phase_name(day)
        m_id = module_ids[phase_title]
        part_num = ((day - 1) % 10) + 1
        lesson_title = f"Day {day}: {phase_title.split(':')[1].strip()} - Part {part_num}"
        lesson_slug = f"day-{day}-{slugify(lesson_title)}"
        is_preview = (day <= 3) # First 3 days are free previews
        content = f"# Day {day}: {lesson_title}\n\nWelcome to Day {day} of the 90-day enterprise engineering challenge.\n\n### Technical Objectives\n- Master high-leverage architectural patterns.\n- Implement verified code patterns and robust telemetry.\n\n$$\\\\text{{Throughput}} = \\\\frac{{\\\\text{{Completed Units}}}}{{\\\\Delta t}}$$\n\n```typescript\nexport const day{day} = () => console.log('Lesson {day} verified');\n```"

        conn.run(
            """
            INSERT INTO public.app_akstack_lms_lessons (module_id, title, slug, content, order_index, is_preview)
            VALUES (:mid, :title, :slug, :content, :order_idx, :is_preview)
            ON CONFLICT (module_id, slug) DO UPDATE
            SET title = EXCLUDED.title, content = EXCLUDED.content, is_preview = EXCLUDED.is_preview;
            """,
            mid=m_id,
            title=lesson_title,
            slug=lesson_slug,
            content=content,
            order_idx=part_num,
            is_preview=is_preview
        )
        lesson_count += 1

    print(f"Seeded {lesson_count} lessons across 9 modules.")

    # 4. Final verification count
    total_courses = conn.run("SELECT count(*) FROM public.app_akstack_lms_courses;")[0][0]
    total_modules = conn.run("SELECT count(*) FROM public.app_akstack_lms_modules;")[0][0]
    total_lessons = conn.run("SELECT count(*) FROM public.app_akstack_lms_lessons;")[0][0]
    preview_lessons = conn.run("SELECT count(*) FROM public.app_akstack_lms_lessons WHERE is_preview = true;")[0][0]

    print("--- Database Telemetry Report ---")
    print(f"Courses: {total_courses}")
    print(f"Modules: {total_modules}")
    print(f"Lessons: {total_lessons} (Free previews: {preview_lessons})")

    conn.close()

if __name__ == "__main__":
    main()
