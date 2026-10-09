
public class TestTicketDetail {

    public static void main(String[] args) {

        TicketDetail ticket = new TicketDetail(
            1001,
            "Cannot access eFundi",
            "I cannot log into my eFundi account.",
            "06 October 2026",
            "Open",
            "High",
            "Account",
            "NWU Student",
            "Helpdesk Technician",
            "Not yet resolved"
        );

        ticket.displayTicket();

        ticket.setStatus("In Progress");
        ticket.setAssignedTechnician("John Smith");

        System.out.println("\nUpdated Ticket:");
        ticket.displayTicket();
    }
}  
