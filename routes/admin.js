const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const exe = require('../config/conn');
const PDFDocument = require('pdfkit');


router.get('/', auth, (req, res) => {
   res.render("admin/index");
});
router.get('/add_new_employee',auth, (req, res) => {
   res.render("admin/add_new_employee", {
      success_msg: null,
      error_msg: null
   });
});
router.post('/add_employee',auth, async (req, res) => {

   const { employee_name, employee_mobile, joining_date, salary_type, monthly_salary, daily_wage, overtime_rate,employee_address } = req.body;
   try{

      const sql = `
      INSERT INTO employees
      (employee_name, employee_mobile, joining_date, salary_type, monthly_salary, daily_wage, overtime_rate, employee_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await exe(sql, [
         employee_name,
         employee_mobile,
         joining_date,
         salary_type,
         monthly_salary,
         daily_wage,
         overtime_rate,
         employee_address
      ]);

      res.render('admin/add_new_employee', {
         success_msg: "Employee added successfully!",
         error_msg: null
      });

   }catch(err){

      console.log(err);

      res.render('admin/add_new_employee', {
         success_msg: null,
         error_msg: "Employee not added"
      });

   }

});
   
router.get('/employee_list', auth,  async (req, res) => {

   try{
      const sql = `SELECT * FROM employees ORDER BY employee_id DESC`;
      const employees = await exe(sql);
      res.render('admin/employee_list', { employees, success_msg: req.query.success_msg, error_msg: req.query.error_msg });
   }catch(err){
      console.log(err);
      res.render('admin/employee_list', { employees: [], success_msg: null, error_msg: "Failed to retrieve employees" });
   }
});
router.get('/edit_employee/:id',auth, async (req,res)=>{
try{

   const employee = await exe(
   "SELECT * FROM employees WHERE employee_id=?",
   [req.params.id]
   );
   
   res.render('admin/edit_employee',{
   employee: employee[0]
   });
}catch(err){
   console.log(err);
   res.redirect('/employee_list');
}
});
router.post('/update_employee/:id',auth, async (req,res)=>{

const { employee_name, employee_mobile, joining_date,
salary_type, monthly_salary, daily_wage, overtime_rate, employee_address } = req.body;

try{

await exe(`
UPDATE employees SET
employee_name=?,
employee_mobile=?,
joining_date=?,
salary_type=?,
monthly_salary=?,
daily_wage=?,
overtime_rate=?,
employee_address=?
WHERE employee_id=?
`,
[
employee_name,
employee_mobile,
joining_date,
salary_type,
monthly_salary,
daily_wage,
overtime_rate,
employee_address,
req.params.id
]);

res.redirect('/employee_list?success_msg=Employee updated successfully');

}catch(err){

console.log(err);

res.redirect('/employee_list?error_msg=Employee not updated');

}

});

router.get('/delete_employee/:id', auth,   async (req,res)=>{

try{

await exe("DELETE FROM employees WHERE employee_id=?", [req.params.id]);

res.redirect('/employee_list?success_msg=Employee deleted successfully');

}catch(err){

console.log(err);

res.redirect('/employee_list?error_msg=Employee not deleted');

}

});
 
router.get('/company_settings', auth, async (req, res) => {

try{

const sql = `SELECT * FROM company_settings WHERE setting_id=1`;

const companyInfo = await exe(sql);

const settings = companyInfo.length ? companyInfo[0] : {};

res.render("admin/company_settings", {
settings,
success_msg: req.query.success_msg,
error_msg: req.query.error_msg
});

}catch(err){

console.log(err);

res.render("admin/company_settings", {
settings:{},
error_msg:"Failed to retrieve company information"
});

}

});
router.post('/update_company_settings', auth, async (req, res) => {

const {
company_name,
company_address,
company_mobile,
ot_start_after,
lunch_break,
duty_hours,
shift_hours
} = req.body;

try{

const sql = `
UPDATE company_settings SET
company_name=?,
company_address=?,
company_mobile=?,
ot_start_after=?,
lunch_break=?,
duty_hours=?,
shift_hours=?
WHERE setting_id=1
`;

await exe(sql, [
company_name,
company_address,
company_mobile,
ot_start_after,
lunch_break,
duty_hours,
shift_hours
]);

res.redirect('/company_settings?success_msg=Company settings updated successfully');

}catch(err){

console.log(err);

res.redirect('/company_settings?error_msg=Failed to update company settings');

}

});

router.get('/add_attendance', auth, async (req, res) => {

try{

const employees = await exe(`SELECT employee_id, employee_name FROM employees ORDER BY employee_name ASC`);

res.render("admin/add_attendance", {
employees,
success_msg: req.query.success_msg,
error_msg: req.query.error_msg
});

}catch(err){

console.log(err);

res.render("admin/add_attendance", {
employees: [],
success_msg: null,
error_msg: "Failed to load employees"
});

}

});
router.post('/save_attendance', auth, async (req, res) => {

try{

const { attendance_date, employee_id, in_time, out_time, status } = req.body;

/* Get company settings */
const settings = await exe(`SELECT * FROM company_settings WHERE setting_id=1`);

const duty_limit = settings[0].duty_hours;

/* Loop employees */

for(let i=0;i<employee_id.length;i++){

if(!in_time[i] || !out_time[i]) continue;

/* Convert time to hours */

let inTime = new Date(`1970-01-01T${in_time[i]}`);
let outTime = new Date(`1970-01-01T${out_time[i]}`);

let total_hours = (outTime - inTime) / (1000 * 60 * 60);

/* Duty hours */

let duty_hours = total_hours >= duty_limit ? duty_limit : total_hours;

/* OT calculation */

let ot_hours = total_hours > duty_limit ? (total_hours - duty_limit) : 0;

/* Round values */
total_hours = total_hours.toFixed(2);
duty_hours = duty_hours.toFixed(2);
ot_hours = ot_hours.toFixed(2);

/* Insert attendance */
await exe(`
INSERT INTO attendance
(employee_id,attendance_date,in_time,out_time,total_hours,duty_hours,ot_hours,status)
VALUES (?,?,?,?,?,?,?,?)
`,[
employee_id[i],
attendance_date,
in_time[i],
out_time[i],
total_hours,
duty_hours,
ot_hours,
status[i]
]);

}

res.redirect('/add_attendance?success_msg=Attendance saved');

}catch(err){

console.log(err);

res.redirect('/add_attendance?error_msg=Attendance not saved');

}

});
router.get('/attendance_list', auth, async (req,res)=>{

let {employee_id,start_date,end_date} = req.query;

let where = "WHERE 1=1";

let params = [];

if(employee_id){

where += " AND a.employee_id=?";
params.push(employee_id);

}

if(start_date){

where += " AND a.attendance_date >= ?";
params.push(start_date);

}

if(end_date){

where += " AND a.attendance_date <= ?";
params.push(end_date);

}

const attendance = await exe(`
SELECT a.*,e.employee_name
FROM attendance a
JOIN employees e ON e.employee_id = a.employee_id
${where}
ORDER BY attendance_date DESC
`,params);

const employees = await exe("SELECT employee_id,employee_name FROM employees");

res.render("admin/attendance_list",{

attendance,
employees,
employee_id,
start_date,
end_date,
success_msg: req.query.success_msg,
error_msg: req.query.error_msg


});

});

router.get('/edit_attendance/:id', auth, async (req,res)=>{

const attendance = await exe(`
SELECT * FROM attendance WHERE attendance_id=?
`,[req.params.id]);

const employees = await exe(`
SELECT employee_id,employee_name FROM employees
`);

res.render("admin/edit_attendance",{
attendance:attendance[0],
employees
});

});
router.post('/update_attendance/:id', auth, async (req,res)=>{

const {
employee_id,
attendance_date,
in_time,
out_time,
status
} = req.body;

const settings = await exe("SELECT duty_hours FROM company_settings WHERE setting_id=1");

const duty_limit = settings[0].duty_hours;

let inTime = new Date(`1970-01-01T${in_time}`);
let outTime = new Date(`1970-01-01T${out_time}`);

let total_hours = (outTime - inTime) / (1000*60*60);

let duty_hours = total_hours >= duty_limit ? duty_limit : total_hours;

let ot_hours = total_hours > duty_limit ? total_hours - duty_limit : 0;

await exe(`
UPDATE attendance SET
employee_id=?,
attendance_date=?,
in_time=?,
out_time=?,
total_hours=?,
duty_hours=?,
ot_hours=?,
status=?
WHERE attendance_id=?
`,[
employee_id,
attendance_date,
in_time,
out_time,
total_hours,
duty_hours,
ot_hours,
status,
req.params.id
]);

res.redirect('/attendance_list?success_msg=Attendance updated');

});
router.get("/add_advance_payment", auth, async (req,res)=>{

const employees = await exe("SELECT employee_id,employee_name FROM employees");
res.render("admin/add_advance_payment",{
employees,
success_msg: req.query.success_msg,
error_msg: req.query.error_msg
});
});
router.post('/save_advance_payment', auth, async (req,res)=>{

const {employee_id,advance_date,amount,remark} = req.body;

try{

await exe(`
INSERT INTO advance_payments
(employee_id,advance_date,advance_amount,advance_note)
VALUES (?,?,?,?)
`,
[
employee_id,
advance_date,
amount,
remark
]);

res.redirect('/add_advance_payment?success_msg=Advance saved');

}catch(err){

console.log(err);

res.redirect('/add_advance_payment?error_msg=Advance not saved');

}

});

router.get('/advance_payment_list', auth, async (req,res)=>{

let {employee_id} = req.query;

let where = "WHERE 1=1";
let params = [];

if(employee_id){
where += " AND a.employee_id=?";
params.push(employee_id);
}

const advance = await exe(`
SELECT a.*,e.employee_name
FROM advance_payments a
JOIN employees e ON e.employee_id = a.employee_id
${where}
ORDER BY advance_date DESC
`,params);

const employees = await exe("SELECT employee_id,employee_name FROM employees");

res.render("admin/advance_payment_list",{

advance,
employees,
employee_id,
success_msg: req.query.success_msg,
error_msg: req.query.error_msg


});

});
router.get('/edit_advance/:id', auth, async (req,res)=>{

const advance = await exe(
"SELECT * FROM advance_payments WHERE advance_id=?",
[req.params.id]
);

const employees = await exe(
"SELECT employee_id,employee_name FROM employees"
);

res.render("admin/edit_advance",{
advance: advance[0],
employees
});

});
router.post('/update_advance/:id', auth, async (req,res)=>{

const {employee_id,advance_date,amount,remark} = req.body;

await exe(`
UPDATE advance_payments SET
employee_id=?,
advance_date=?,
advance_amount=?,
advance_note=?
WHERE advance_id=?
`,
[
employee_id,
advance_date,
amount,
remark,
req.params.id
]);

res.redirect('/advance_payment_list?success_msg=Advance updated');

});
router.get("/delete_advance/:id", auth, async (req,res)=>{
try{

await exe("DELETE FROM advance_payments WHERE advance_id=?", [req.params.id]);
res.redirect('/advance_payment_list?success_msg=Advance deleted');

}catch(err){

console.log(err);
res.redirect('/advance_payment_list?error_msg=Advance not deleted'); 
}
});

router.get('/salary_generate', auth, async (req,res)=>{

const employees = await exe(`
SELECT employee_id,employee_name FROM employees
`);

res.render("admin/salary_generate",{
employees,
success_msg:req.query.success_msg,
error_msg:req.query.error_msg
});

});

router.post('/generate_salary', auth, async (req,res)=>{

const {employee_id,from_date,to_date} = req.body;

try{

const emp = await exe(`
SELECT * FROM employees WHERE employee_id=?
`,[employee_id]);

const attendance = await exe(`
SELECT 
SUM(duty_hours) as duty_hours,
SUM(ot_hours) as ot_hours
FROM attendance
WHERE employee_id=?
AND attendance_date BETWEEN ? AND ?
`,[
employee_id,
from_date,
to_date
]);

let duty_hours = attendance[0].duty_hours || 0;
let ot_hours = attendance[0].ot_hours || 0;

let duty_salary = 0;

if(emp[0].salary_type == "monthly"){
duty_salary = emp[0].monthly_salary;
}else{

const settings = await exe(`
SELECT duty_hours FROM company_settings WHERE setting_id=1
`);

let duty_per_day = settings[0].duty_hours;

let working_days = duty_hours / duty_per_day;

duty_salary = working_days * emp[0].daily_wage;
// console.log("Working days:", working_days);

}

let ot_salary = ot_hours * emp[0].overtime_rate;

const advance = await exe(`
SELECT SUM(advance_amount) as advance
FROM advance_payments
WHERE employee_id=?
AND advance_date BETWEEN ? AND ?
`,[
employee_id,
from_date,
to_date
]);

let advance_amount = advance[0].advance || 0;

let net_salary = duty_salary + ot_salary - advance_amount;

await exe(`
INSERT INTO salary
(employee_id,from_date,to_date,total_duty_hours,total_ot_hours,duty_salary,ot_salary,advance_deduction,net_salary)
VALUES (?,?,?,?,?,?,?,?,?)
`,[
employee_id,
from_date,
to_date,
duty_hours,
ot_hours,
duty_salary,
ot_salary,
advance_amount,
net_salary
]);

res.redirect('/salary_generate?success_msg=Salary Generated');

}catch(err){

console.log(err);

res.redirect('/salary_generate?error_msg=Salary generation failed');

}

});

router.get('/salary_list', auth, async (req,res)=>{

let {employee_id,salary_month} = req.query;

let where = "WHERE 1=1";
let params = [];

if(employee_id){
where += " AND s.employee_id=?";
params.push(employee_id);
}

if(salary_month){

where += " AND DATE_FORMAT(s.from_date,'%Y-%m')=?";
params.push(salary_month);

}

const salary = await exe(`
SELECT s.*,e.employee_name
FROM salary s
JOIN employees e ON e.employee_id = s.employee_id
${where}
ORDER BY s.salary_id DESC
`,params);

const employees = await exe(`
SELECT employee_id,employee_name FROM employees
`);

res.render("admin/salary_list",{

salary,
employees,
employee_id,
salary_month

});

});


router.get('/salary_slip/:id', auth, async (req,res)=>{

try{

const salary = await exe(`
SELECT s.*,e.employee_name
FROM salary s
JOIN employees e ON e.employee_id = s.employee_id
WHERE s.salary_id=?
`,[req.params.id]);

const data = salary[0];

const doc = new PDFDocument({margin:50});

res.setHeader('Content-Type','application/pdf');
res.setHeader(
'Content-Disposition',
`attachment; filename=salary-slip-${data.employee_name}.pdf`
);

doc.pipe(res);

/* ---------- HEADER ---------- */

doc
.fontSize(18)
.font("Helvetica-Bold")
.text("SALARY SLIP",50,50);

doc
.fontSize(10)
.font("Helvetica")
.text(`Date: ${new Date().toLocaleDateString("en-GB")}`,450,50);

/* Line */
doc.moveTo(50,75).lineTo(550,75).stroke();


/* ---------- EMPLOYEE DETAILS ---------- */

doc.moveDown(2);

doc
.fontSize(11)
.font("Helvetica-Bold")
.text("Employee Name:",50,100)
.font("Helvetica")
.text(data.employee_name,160,100)

.font("Helvetica-Bold")
.text("Employee Code:",50,120)
.font("Helvetica")
.text("EMP-"+String(data.employee_id).padStart(4,'0'),160,120)

.font("Helvetica-Bold")
.text("Salary Period:",50,140)
.font("Helvetica")
.text(
`${new Date(data.from_date).toLocaleDateString("en-GB")} - ${new Date(data.to_date).toLocaleDateString("en-GB")}`,
160,
140
);


/* ---------- TABLE ---------- */

let tableTop = 190;

doc.rect(50,tableTop,500,25).stroke();

doc
.font("Helvetica-Bold")
.text("Earnings / Deductions",60,tableTop+7)
.text("Amount (₹)",450,tableTop+7);

let y = tableTop + 25;

function tableRow(label,value){

doc.rect(50,y,500,25).stroke();

doc
.font("Helvetica")
.text(label,60,y+7)
.text(value,450,y+7);

y += 25;
}

tableRow("Duty Salary",data.duty_salary);
tableRow("OT Salary",data.ot_salary);
tableRow("Advance Deduction","- "+data.advance_deduction);

doc
.rect(50,y,500,25)
.stroke();

doc
.font("Helvetica-Bold")
.text("Net Salary Paid",60,y+7)
.text(data.net_salary,450,y+7);


/* ---------- NET PAYABLE BOX ---------- */

doc
.rect(350,y+60,200,40)
.stroke();

doc
.font("Helvetica-Bold")
.text("Net Payable:",360,y+70);

doc
.font("Helvetica")
.text(`₹ ${data.net_salary}`,360,y+85);


/* ---------- SIGNATURE ---------- */

doc
.fontSize(11)
.text("For Your Company Name",380,y+150);

doc.moveTo(380,y+180).lineTo(520,y+180).stroke();

doc
.text("Authorised Signatory",390,y+185);

doc.end();

}catch(err){

console.log(err);
res.send("Error generating slip");

}

});

module.exports = router;   