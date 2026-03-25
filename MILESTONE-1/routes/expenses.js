const express = require("express");
const router = express.Router();
const db = require("../db");

// GET all expenses
router.get("/", (req, res) => {
  db.query("SELECT id, amount, category, description, date FROM expenses ORDER BY date DESC", (err, result) => {
    if (err) throw err;
    // Map 'description' to 'desc' and ensure no nulls
    const mapped = result.map(row => ({
      id: row.id.toString(),
      amount: parseFloat(row.amount),
      category: row.category,
      desc: row.description || '',
      date: row.date
    }));
    res.json(mapped);
  });
});

// ADD expense
router.post("/", (req, res) => {
  const { amount, category, desc, date } = req.body;
  const sql = "INSERT INTO expenses (amount, category, description, date) VALUES (?, ?, ?, ?)";
  
  db.query(sql, [amount, category, desc, date], (err, result) => {
    if (err) throw err;
    res.json({ message: "Expense added" });
  });
});

// DELETE expense
router.delete("/:id", (req, res) => {
  db.query("DELETE FROM expenses WHERE id=?", [req.params.id], (err) => {
    if (err) throw err;
    res.json({ message: "Deleted" });
  });
});

// UPDATE expense
router.put("/:id", (req, res) => {
  const { amount, category, desc, date } = req.body;
  const { id } = req.params;
  const sql = "UPDATE expenses SET amount=?, category=?, description=?, date=? WHERE id=?";
  
  db.query(sql, [amount, category, desc, date, id], (err, result) => {
    if (err) throw err;
    res.json({ message: "Expense updated" });
  });
});

module.exports = router;