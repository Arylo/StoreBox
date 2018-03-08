import * as db from "../helpers/database";
import * as md5 from "md5";
import { Model as RegexpsModel, RegexpDoc } from "@models/Regexp";
import { Model as CategoryModel, ICategoryRaw } from "@models/Categroy";
import { newName } from "../helpers/utils";

describe("RegExp Model", () => {

    let Category: ICategoryRaw;

    before(() => {
        return db.connect();
    });

    beforeEach(async () => {
        const result = await CategoryModel.create({
            name: newName()
        });
        ids.categories.push(result._id);
        Category = result.toObject() as ICategoryRaw;
    });

    const ids = {
        categories: [ ],
        regexps: [ ]
    };
    afterEach(() => {
        return db.drop(ids);
    });

    it("Add Regexp", async () => {
        const md5sum = md5(Date.now() + "");
        const reg = await RegexpsModel.addRegexp(md5sum, /[\da-fA-F]/.source);
        ids.regexps.push(reg._id);
        reg.should.be.not.an.empty();
    });

    it("Add/Remove Regexp", async () => {
        const md5sum = md5(Date.now() + "");
        let reg: RegexpDoc;

        reg = await RegexpsModel.addRegexp(md5sum, /[\da-fA-F]/.source);
        ids.regexps.push(reg._id);
        reg = await RegexpsModel.removeRegexp(reg._id);
        reg = await RegexpsModel.findById(reg._id).exec();

        should(reg).be.a.null();
    });

    it.skip("Link One Category And Undo", async () => {
        // const md5sum = md5(Date.now() + "");
        // let reg: RegexpDoc;

        // reg = await RegexpsModel.addRegexp(md5sum, /[\da-fA-F]/.source);
        // ids.regexps.push(reg._id);
        // reg = await RegexpsModel.link(reg._id, Category._id);
        // reg = await RegexpsModel.link(reg._id, false);
        // reg = await RegexpsModel.findById(reg._id).exec();

        // should(reg.toObject().link).be.a.undefined();
    });

    // Discern Method move to Service
    it.skip("Discern from No link Regexp", async () => {
        // const md5sum = md5(Date.now() + "");
        // const regs = [
        //     await RegexpsModel.addRegexp(`${md5sum}1`, /[\da-fA-F]/.source),
        //     await RegexpsModel.addRegexp(`${md5sum}2`, /[\da-fA-F]{16}/.source),
        //     await RegexpsModel.addRegexp(`${md5sum}3`, /[\da-fA-F]{8}/.source)
        // ];
        // for (const reg of regs) {
        //     ids.regexps.push(reg._id);
        // }
        // const list = await RegexpsModel.discern(md5sum);
        // list.should.be.length(0);
    });

    // Discern Method move to Service
    it.skip("Discern from linked Regexps", async () => {
        // const md5sum = md5(Date.now() + "");
        // const regs = [
        //     await RegexpsModel.addRegexp(`${md5sum}1`, /[\da-fA-F]/.source),
        //     await RegexpsModel.addRegexp(`${md5sum}2`, /[\da-fA-F]{16}/.source),
        //     await RegexpsModel.addRegexp(`${md5sum}3`, /[\da-fA-F]{8}/.source)
        // ];
        // for (const reg of regs) {
        //     ids.regexps.push(reg._id);
        //     await RegexpsModel.link(reg._id, Category._id);
        // }
        // const list = await RegexpsModel.discern(md5sum);
        // list.should.be.length(3);
    });

});
