import { pool } from 

function snakeToCamelCase(str) {
    return str.replace(/(_\w)/g, match => match[1].toUpperCase());
}

export const getCheckin =  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Error connecting to the database:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }

    const query = 
    ` SELECT flight.*, boarding_pass.boarding_pass_id, boarding_pass.passenger_name, tickets.age, tickets.class
      FROM flights
      INNER JOIN tickets ON flights.id = tickets.flight_id
      WHERE flights.id = ?;`
      ;

    connection.query(query, [flightId], (err, results) => {
      connection.release(); // Release the connection

      if (err) {
        console.error('Error executing the query:', err);
        return res.status(500).json({ message: 'Internal server error' });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: 'Flight not found' });
      }

      const flight = {};
      const passengers = results.map(ticket => ({
        ticketId: ticket.ticket_id,
        passengerName: ticket.passenger_name,
        age: ticket.age,
        class: ticket.class
      }));

      flight.passengers = passengers;

      // Group passengers by age
      const passengersByAge = passengers.reduce((groups, passenger) => {
        const groupKey = passenger.age < 18 ? 'under18' : 'over18';
        if (!groups[groupKey]) {
          groups[groupKey] = [];
        }
        groups[groupKey].push(passenger);
        return groups;
      }, {});

      // Assign seats based on rules
      const seatAssignments = {};

      // Under 18 passengers seated near over 18 passengers
      if (passengersByAge.under18 && passengersByAge.over18) {
        passengersByAge.under18.forEach(under18Passenger => {
          const over18Passenger = passengersByAge.over18.shift();
          seatAssignments[under18Passenger.ticketId] = over18Passenger.ticketId;
        });
      }

      // Group passengers seated near each other
      const groupedPassengers = passengers.filter(passenger => passenger.class !== 'Economic');
      if (groupedPassengers.length > 1) {
        for (let i = 0; i < groupedPassengers.length - 1; i++) {
          const currentPassenger = groupedPassengers[i];
          const nextPassenger = groupedPassengers[i + 1];
          seatAssignments[currentPassenger.ticketId] = nextPassenger.ticketId;
        }
      }

      // Assign seats
      passengers.forEach(passenger => {
        if (!seatAssignments[passenger.ticketId]) {
          seatAssignments[passenger.ticketId] = null;
        }
      });

      flight.seatAssignments = seatAssignments;

      return res.json(flight);
    });
  });