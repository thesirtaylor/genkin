let Store = require('../model/owner').store;
//------------------------------------------------------------------------------------------------------------
//------------------------------------Custom mail sender function---------------------------------------------

var 
    sgMail = require('@sendgrid/mail'),
    mailKey = process.env.SGMAIL_APIKEY;

module.exports = function mailer(from, to, subject, body, callback) {
    sgMail.setApiKey(mailKey);
    var mail = {
        from: from,
        to: to,
        subject: subject,
        body: body
    };
    sgMail.send(mail, callback);
}


//call function in controller as so
mailer('gmail', 'yahoo', 'a mail', 'textbody', (error, mail)=>{
    if (error) {return  res.status(500).json(ERR('Mail sending failed'));}
    res.status.json(SUCCESS('Staff Verification mail sent successfully to' + req.body.mail))
});


