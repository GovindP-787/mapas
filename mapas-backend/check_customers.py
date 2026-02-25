from services.database import CustomerFaceRepository

repo = CustomerFaceRepository()
customers = repo.get_all_customers()

print(f'Found {len(customers)} customers')
for c in customers:
    name = c.get('name', 'No name')
    customer_id = c.get('id', 'No ID')
    has_embedding = bool(c.get('face_embedding'))
    print(f'- {name} (ID: {customer_id}) - Has embedding: {has_embedding}')