const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generates an automated PDF slip and saves it to the uploads folder.
 */
const generateDocument = (documentType, parent, requestData, signatureFile) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            
            const generatedDir = path.join('uploads', 'generated_documents');
            if (!fs.existsSync(generatedDir)) {
                fs.mkdirSync(generatedDir, { recursive: true });
            }

            const fileName = `REQ-${Date.now()}-${requestData.student_bemis_id || 'SLIP'}.pdf`;
            const filePath = path.join(generatedDir, fileName);
            const stream = fs.createWriteStream(filePath);

            doc.pipe(stream);

            if (documentType.name === 'lateness_form' || documentType.name === 'absence_form') {
                let formDataObj = {};
                if (typeof requestData.form_data === 'string') {
                    try { formDataObj = JSON.parse(requestData.form_data); } catch(e){}
                } else if (typeof requestData.form_data === 'object'){
                    formDataObj = requestData.form_data;
                }

                doc.fontSize(18).text('BMHS Form for Absence and Lateness', { align: 'center' });
                doc.moveDown(1.5);

                doc.fontSize(12);

                // Date of Return and Class
                doc.font('Helvetica').text('Date of Return: ', { continued: true }).font('Helvetica-Bold').text(formDataObj.date_of_return || '__________________', { continued: true })
                   .font('Helvetica').text('       Class: ', { continued: true }).font('Helvetica-Bold').text(formDataObj.class || '__________________');
                doc.moveDown();

                // Name of Student
                doc.font('Helvetica').text('Name of Student: ', { continued: true }).font('Helvetica-Bold').text(requestData.student_full_name || '________________________________________________');
                doc.moveDown();

                // Date(s) of Absence/Lateness
                doc.font('Helvetica').text('Date(s) of Absence/Lateness: ', { continued: true }).font('Helvetica-Bold').text(formDataObj.dates_of_absence_or_lateness || '_____________________________________');
                doc.moveDown();

                // No. of days absent
                if (documentType.name === 'absence_form') {
                    doc.font('Helvetica').text('No. of days absent: ', { continued: true }).font('Helvetica-Bold').text(formDataObj.number_of_days_absent || '________');
                    doc.moveDown();
                }

                doc.moveDown();
                doc.font('Helvetica-Oblique').text('REASON FOR ABSENCE OR TARDY: (CHECK ONE)');
                doc.moveDown(0.5);

                // Categories drawing
                const categories = [
                    { key: 'sickness', label: 'SICKNESS', detailLabel: '(SPECIFY)' },
                    { key: 'traffic', label: 'TRAFFIC', detailLabel: '(SPECIFY)' },
                    { key: 'medical', label: 'MEDICAL APPOINTMENT', detailLabel: '(DISMISSAL/RETURN TIME)' },
                    { key: 'dental', label: 'DENTAL APPOINTMENT', detailLabel: '(DISMISSAL/RETURN TIME)' },
                    { key: 'funeral', label: 'FUNERAL', detailLabel: '(DISMISSAL/RETURN TIME)' },
                    { key: 'other', label: 'OTHER', detailLabel: '(SPECIFY REASON)' }
                ];

                categories.forEach(cat => {
                    const isSelected = formDataObj.reason_category === cat.key;
                    const checkbox = isSelected ? '[X]' : '[  ]';
                    const detailText = isSelected ? (formDataObj.reason_details || '') : '';
                    
                    doc.font('Helvetica').text(`  ${checkbox}  `, { continued: true })
                       .font(isSelected ? 'Helvetica-Bold' : 'Helvetica').text(`${cat.label} `, { continued: true })
                       .font('Helvetica-Oblique').text(`${cat.detailLabel}: `, { continued: true })
                       .font('Helvetica-Bold').text(isSelected ? detailText : '________________________________________');
                    doc.moveDown(0.8);
                });

                doc.moveDown();
                doc.font('Helvetica').text('Home Room Teacher: ', { continued: true }).font('Helvetica-Bold').text(formDataObj.home_room_teacher || '_______________________________________');
                doc.moveDown();

                doc.font('Helvetica').text('Parent/Guardian Name: ', { continued: true }).font('Helvetica-Bold').text(parent.full_name || '_____________________________________');
                doc.moveDown();

                // Parent/Guardian Signature
                doc.font('Helvetica').text('Parent/Guardian Signature: _____________________________________');
                
                // Embed signature image if it exists
                if (signatureFile) {
                    doc.image(signatureFile.path, 180, doc.y - 30, { fit: [150, 25] });
                }
                doc.moveDown();

                doc.font('Helvetica').text('Date Received: _____________________________________');
                doc.moveDown();

                doc.text('Absence Excused _______      Absence Unexcused _______');
                doc.moveDown(2);

                // Footer lines:
                doc.fontSize(10);
                doc.font('Helvetica-Bold').text('*ABSENCES:');
                doc.font('Helvetica').text('*The student\'s parent/guardian is expected to notify the office as early as possible. Upon return to school, the student MUST bring the completed absence form signed by a parent/guardian and give it to the homeroom teacher(s). This note, in addition to a phone call, is a required written record for the student\'s file. Forms for an absence due to illness for more than a day must be accompanied by a doctor\'s note.', { align: 'justify' });
                doc.moveDown(0.5);

                doc.font('Helvetica-Bold').text('*LATENESS:');
                doc.font('Helvetica').text('*The completed form must be submitted no later than the day after the lateness.', { align: 'justify' });

            } else {
                doc.fontSize(20).text('Bishop Martin High School', { align: 'center' });
                doc.moveDown();
                doc.fontSize(16).text(documentType.name.replace('_', ' ').toUpperCase(), { align: 'center', underline: true });
                doc.moveDown(2);

                doc.fontSize(12);
                doc.text(`Date of Request: ${new Date().toLocaleDateString()}`);
                doc.text(`Student Name: ${requestData.student_full_name}`);
                doc.text(`BEMIS ID: ${requestData.student_bemis_id || 'N/A'}`);
                doc.text(`Graduation Year/Years Attended: ${requestData.student_graduation_year_or_years_attended || 'N/A'}`);
                doc.moveDown();

                let formDataObj = {};
                if (typeof requestData.form_data === 'string') {
                    try { formDataObj = JSON.parse(requestData.form_data); } catch(e){}
                } else if (typeof requestData.form_data === 'object'){
                    formDataObj = requestData.form_data;
                }

                if (Object.keys(formDataObj).length > 0) {
                    doc.text('--- Additional Details ---', { underline: true });
                    for (const [key, value] of Object.entries(formDataObj)) {
                        const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                        doc.text(`${formattedKey}: ${value}`);
                    }
                    doc.moveDown();
                }

                doc.moveDown(4);
                doc.text('_____________________________', { align: 'left' });
                doc.text(`Parent/Guardian: ${parent.full_name}`, { align: 'left' });

                if (signatureFile) {
                    doc.image(signatureFile.path, 50, doc.y - 70, { fit: [200, 50], align: 'left', valign: 'bottom' });
                }
            }

            doc.end();

            stream.on('finish', () => {
                resolve(`uploads/generated_documents/${fileName}`);
            });
            stream.on('error', (err) => reject(err));

        } catch (error) {
            reject(error);
        }
    });
};

module.exports = { generateDocument };
