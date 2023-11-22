class AdminController {

    async uploadFile(req, res) {
        try {
            if (req.file) {
                res.status(200).send({ file: req.file });
            }
        } catch (err) {
            res.status(500);
            console.log(err);
        }
        // const { filename, path } = req.file;
        // const file = File.create({ name: filename, path });
        // res.status(200).send({ filename, path });
    }
}

module.exports = new AdminController();