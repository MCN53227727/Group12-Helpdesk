
public class TicketDetail {

    private int ticketID;
    private String title;
    private String description;
    private String dateCreated;
    private String status;
    private String priority;
    private String category;
    private String requester;
    private String assignedTechnician;
    private String resolution;

    public TicketDetail(int ticketID, String title, String description,
                        String dateCreated, String status, String priority,
                        String category, String requester,
                        String assignedTechnician, String resolution) {

        this.ticketID = ticketID;
        this.title = title;
        this.description = description;
        this.dateCreated = dateCreated;
        this.status = status;
        this.priority = priority;
        this.category = category;
        this.requester = requester;
        this.assignedTechnician = assignedTechnician;
        this.resolution = resolution;
    }

    public int getTicketID() {
        return ticketID;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public String getDateCreated() {
        return dateCreated;
    }

    public String getStatus() {
        return status;
    }

    public String getPriority() {
        return priority;
    }

    public String getCategory() {
        return category;
    }

    public String getRequester() {
        return requester;
    }

    public String getAssignedTechnician() {
        return assignedTechnician;
    }

    public String getResolution() {
        return resolution;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public void setAssignedTechnician(String assignedTechnician) {
        this.assignedTechnician = assignedTechnician;
    }

    public void setResolution(String resolution) {
        this.resolution = resolution;
    }

    public void displayTicket() {
        System.out.println("Ticket ID: " + ticketID);
        System.out.println("Title: " + title);
        System.out.println("Description: " + description);
        System.out.println("Date Created: " + dateCreated);
        System.out.println("Status: " + status);
        System.out.println("Priority: " + priority);
        System.out.println("Category: " + category);
        System.out.println("Requester: " + requester);
        System.out.println("Assigned Technician: " + assignedTechnician);
        System.out.println("Resolution: " + resolution);
    }
}
