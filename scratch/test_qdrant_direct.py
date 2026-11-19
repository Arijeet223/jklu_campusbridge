from rag.qdrant_service import get_qdrant_service

qs = get_qdrant_service()
print("Collection names:")
try:
    cols = qs.client.get_collections()
    print([c.name for c in cols.collections])
except Exception as e:
    print("Error getting collections:", e)

print("\nTesting query_active_placements:")
try:
    hits = qs.query_active_placements(query_text="TechCorp drive", company_name="TechCorp", top_k=3)
    print("Active placement hits:", len(hits))
    for h in hits:
        print(h.get("company_name"), h.get("role_title"))
except Exception as e:
    print("Error querying placements:", e)

print("\nTesting query_student_profile for STU-101:")
try:
    shits = qs.query_student_profile(student_id="STU-101", query="skills resume", top_k=3)
    print("Student profile hits:", len(shits))
    for s in shits:
        print(s.get("section_path"), s.get("content")[:100])
except Exception as e:
    print("Error querying student profile:", e)
