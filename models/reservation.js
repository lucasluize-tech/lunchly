/** Reservation for Lunchly */

const moment = require("moment");

const db = require("../db");


/** A reservation for a party */

class Reservation {
  constructor({id, customerId, numGuests, startAt, notes}) {
    this.id = id;
    this.customerId = customerId;
    this.numGuests = numGuests;
    this.startAt = startAt;
    this.notes = notes;
  }

  /** formatter for startAt */

  getformattedStartAt() {
    return moment(this.startAt).format('MMMM Do YYYY, h:mm a');
  }

  /** given a customer id, find their reservations. */

  static async getReservationsForCustomer(customerId) {
    const results = await db.query(
          `SELECT id, 
           customer_id AS "customerId", 
           num_guests AS "numGuests", 
           start_at AS "startAt", 
           notes AS "notes"
         FROM reservations 
         WHERE customer_id = $1`,
        [customerId]
    );

    return results.rows.map(row => new Reservation(row));
  }
  
  static async getReservationsByIdForCustomer(id){
    const result = await db.query(`SELECT id, 
              customer_id AS "customerId", 
              num_guests AS "numGuests", 
              start_at AS "startAt", 
              notes AS "notes"
              FROM reservations 
              WHERE id = $1`,[id])
    const r = result.rows[0]
    return new Reservation(r.id, r.customer_id, r.num_guests, r.start_at, r.notes)
  }
  
  async save(){
      // new resevation for customer.
      if(this.id === undefined){
        const newRes = await db.query(`INSERT INTO reservations (customer_id, start_at, num_guests, notes)
                  VALUES ($1, $2, $3, $4)
                  RETURNING id, customer_id, start_at, num_guests, notes`, [this.customerId, this.startAt, this.numGuests, this.notes])
        console.log(newRes.rows)
        this.id = newRes.rows[0].id
      
      // update reservation for customer.
      } else {
        await db.query(`UPDATE reservations
                        SET start_at=$1, num_guests=$2, notes=$3, WHERE id=$4`,
                        [this.startAt, this.numGuests, this.notes, this.id])
      }
  }
}



module.exports = Reservation;
