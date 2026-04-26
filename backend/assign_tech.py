import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import SupportTicket, ConnectionRequest, Employee, ConnectionRequestAssignment

def assign_to_technician():
    try:
        tech_employee = Employee.objects.get(user__email='technician@example.com')
        
        # Assign 5 unassigned tickets to technician
        tickets = SupportTicket.objects.filter(assigned_to__isnull=True)[:5]
        for t in tickets:
            t.assigned_to = tech_employee
            t.save()
            print(f"Assigned Ticket #{t.id} to technician")
            
        # Assign 5 unassigned connection requests to technician
        requests = ConnectionRequest.objects.filter(connectionrequestassignment__isnull=True)[:5]
        for r in requests:
            r.assign_technician(tech_employee)
            print(f"Assigned ConnectionRequest #{r.id} to technician")
            
    except Employee.DoesNotExist:
        print("Technician employee not found")

if __name__ == "__main__":
    assign_to_technician()
