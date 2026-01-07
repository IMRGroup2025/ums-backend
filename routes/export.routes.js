import express from "express"
import db from "../db.js"
import PDFDocument from "pdfkit"
import ExcelJS from "exceljs"

const router = express.Router()

/* ===================== PDF EXPORT ===================== */
router.get("/pdf/:utilityId", (req, res) => {
  const utilityId = req.params.utilityId

  const sql = `
    SELECT c.name AS customer,
           u.utility_name,
           b.billing_month,
           b.consumption,
           b.amount,
           b.status
    FROM Bill b
    JOIN Meter m ON b.meter_id = m.meter_id
    JOIN Customer c ON m.customer_id = c.customer_id
    JOIN Utility u ON m.utility_id = u.utility_id
    WHERE u.utility_id = ?
  `

  db.query(sql, [utilityId], (err, results) => {
    if (err) return res.status(500).json(err)

    const doc = new PDFDocument({ margin: 30 })
    res.setHeader("Content-Type", "application/pdf")
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=utility-report-${utilityId}.pdf`
    )

    doc.pipe(res)

    doc.fontSize(18).text("Utility Billing Report", { align: "center" })
    doc.moveDown()

    results.forEach((r) => {
      doc
        .fontSize(11)
        .text(
          `${r.customer} | ${r.utility_name} | ${r.billing_month} | ${r.consumption} | LKR ${r.amount} | ${r.status}`
        )
    })

    doc.end()
  })
})

/* ===================== EXCEL EXPORT ===================== */
router.get("/excel/:utilityId", async (req, res) => {
  const utilityId = req.params.utilityId

  const sql = `
    SELECT c.name AS Customer,
           u.utility_name AS Utility,
           b.billing_month AS Month,
           b.consumption AS Consumption,
           b.amount AS Amount,
           b.status AS Status
    FROM Bill b
    JOIN Meter m ON b.meter_id = m.meter_id
    JOIN Customer c ON m.customer_id = c.customer_id
    JOIN Utility u ON m.utility_id = u.utility_id
    WHERE u.utility_id = ?
  `

  db.query(sql, [utilityId], async (err, results) => {
    if (err) return res.status(500).json(err)

    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet("Utility Report")

    sheet.columns = [
      { header: "Customer", key: "Customer", width: 20 },
      { header: "Utility", key: "Utility", width: 15 },
      { header: "Month", key: "Month", width: 15 },
      { header: "Consumption", key: "Consumption", width: 15 },
      { header: "Amount", key: "Amount", width: 15 },
      { header: "Status", key: "Status", width: 12 },
    ]

    results.forEach((row) => sheet.addRow(row))

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=utility-report-${utilityId}.xlsx`
    )
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )

    await workbook.xlsx.write(res)
    res.end()
  })
})

export default router
