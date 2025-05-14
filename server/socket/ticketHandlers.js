// In your ticket creation handler
socket.on('generate-ticket', async (ticketData, callback) => {
    try {
        // Your existing ticket creation code...
        const newTicket = await prisma.ticket.create({
            data: {
                // ... ticket data
            }
        });

        // Emit ticket creation event to update dashboards
        io.emit('ticket-created', newTicket);

        callback({ success: true, ticket: newTicket });
    } catch (error) {
        console.error('Error generating ticket:', error);
        callback({ success: false, error: error.message });
    }
}); 