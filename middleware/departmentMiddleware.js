const departmentMiddleware = (req, res, next) => {


    if (!req.department) {

        return res.status(401).json({
            message: "Department not authenticated"
        });

    }


    next();

};


module.exports = departmentMiddleware;