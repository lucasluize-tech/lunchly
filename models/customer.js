/** Customer for Lunchly */

const db = require("../db");
const Reservation = require("./reservation");

/** Customer of the restaurant. */

class Customer {
  constructor({ id, firstName, lastName, phone, notes }) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.phone = phone;
    this.notes = notes;
  }
  
  fullName(){
    return `${this.firstName} ${this.lastName}`
  }
  /** find all customers. */

  static async all() {
    const results = await db.query(
      `SELECT id, 
         first_name AS "firstName",  
         last_name AS "lastName", 
         phone, 
         notes
       FROM customers
       ORDER BY last_name, first_name`
    );
    return results.rows.map(c => new Customer(c));
  }

  /** get a customer by ID. */

  static async get(id) {
    const results = await db.query(
      `SELECT id, 
         first_name AS "firstName",  
         last_name AS "lastName", 
         phone, 
         notes 
        FROM customers WHERE id = $1`,
      [id]
    );

    const customer = results.rows[0];

    if (customer === undefined) {
      const err = new Error(`No such customer: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Customer(customer);
  }
  
  static async getByName(name){
    const results = await db.query(`SELECT id, 
      first_name AS "firstName",  
      last_name AS "lastName", 
      phone, 
      notes 
     FROM customers WHERE first_name ILIKE $1`, [`${name}`]);
    
    const customers = results.rows.map(c => new Customer(c));
    
    if(customers.length < 1){
      const err = new Error(`No customers with that name: ${name}`);
      err.status = 404;
      throw err;
    }
   
    return customers;
  }
  
  static async getBestCustomers(){
    const results = await db.query(`SELECT customer_id, count(*)
                                   FROM reservations
                                   GROUP BY customer_id
                                   ORDER BY count DESC
                                   LIMIT 10`)
    
    console.log(results.rows)
    const customers = results.rows.map(c => Customer.get(c.customer_id))
    const loyalCustomers = await Promise.all(customers)
    return loyalCustomers;                              
  }

  /** get all reservations for this customer. */

  async getReservations() {
    return await Reservation.getReservationsForCustomer(this.id);
  }
  
  async getReservationById(id){
    return await Reservation.getReservationByIdForCustomer(id);
    
  }

  /** save this customer. */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO customers (first_name, last_name, phone, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
        [this.firstName, this.lastName, this.phone, this.notes]
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE customers SET first_name=$1, last_name=$2, phone=$3, notes=$4
             WHERE id=$5`,
        [this.firstName, this.lastName, this.phone, this.notes, this.id]
      );
    }
  }
}

module.exports = Customer;
