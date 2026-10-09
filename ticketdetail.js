
class TicketDetail {
    
    #ticketID;
    #title;
    #description;
    #dateCreated;
    #status;
    #priority;
    #category;
    #requester;
    #assignedTechnician;
    #resolution;

    constructor(ticketID, title, description,
                dateCreated, status, priority,
                category, requester,
                assignedTechnician, resolution) {
        this.#ticketID = ticketID;
        this.#title = title;
        this.#description = description;
        this.#dateCreated = dateCreated;
        this.#status = status;
        this.#priority = priority;
        this.#category = category;
        this.#requester = requester;
        this.#assignedTechnician = assignedTechnician;
        this.#resolution = resolution;
    }

   
    getTicketID() {
        return this.#ticketID;
    }
    getTitle() {
        return this.#title;
    }
    getDescription() {
        return this.#description;
    }
    getDateCreated() {
        return this.#dateCreated;
    }
    getStatus() {
        return this.#status;
    }
    getPriority() {
        return this.#priority;
    }
    getCategory() {
        return this.#category;
    }
    getRequester() {
        return this.#requester;
    }
    getAssignedTechnician() {
        return this.#assignedTechnician;
    }
    getResolution() {
        return this.#resolution;
    }

    
    setStatus(status) {
        this.#status = status;
    }
    setPriority(priority) {
        this.#priority = priority;
    }
    setAssignedTechnician(assignedTechnician) {
        this.#assignedTechnician = assignedTechnician;
    }
    setResolution(resolution) {
        this.#resolution = resolution;
    }

    
    displayTicket() {
        console.log("Ticket ID: " + this.#ticketID);
        console.log("Title: " + this.#title);
        console.log("Description: " + this.#description);
        console.log("Date Created: " + this.#dateCreated);
        console.log("Status: " + this.#status);
        console.log("Priority: " + this.#priority);
        console.log("Category: " + this.#category);
        console.log("Requester: " + this.#requester);
        console.log("Assigned Technician: " + this.#assignedTechnician);
        console.log("Resolution: " + this.#resolution);
    }
}


const ticket = new TicketDetail(
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
console.log("\nUpdated Ticket:");
ticket.displayTicket();