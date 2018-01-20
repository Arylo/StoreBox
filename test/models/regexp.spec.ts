import * as db from "../helpers/database";
import * as md5 from "md5";
import * as faker from "faker";
import { Model as RegexpsModel, RegexpDoc } from "@models/Regexp";
import { Model as CategroyModel, ICategroyRaw } from "@models/Categroy";

describe("RegExp Model", () => {

    let Categroy: ICategroyRaw;

    before(() => {
        return db.connect();
    });

    beforeEach(async () => {
        const result = await CategroyModel.create({
            name: faker.name.findName()
        });
        ids.regexps.push(result._id);
        Categroy = result.toObject() as ICategroyRaw;
    });

    const ids = {
        categroies: [ ],
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

    it("Link One Category And Undo", async () => {
        const md5sum = md5(Date.now() + "");
        let reg: RegexpDoc;

        reg = await RegexpsModel.addRegexp(md5sum, /[\da-fA-F]/.source);
        ids.regexps.push(reg._id);
        reg = await RegexpsModel.link(reg._id, Categroy._id);
        reg = await RegexpsModel.link(reg._id, false);
        reg = await RegexpsModel.findById(reg._id).exec();

        should(reg.toObject().link).be.a.undefined();
    });

    it("Discern from No link Regexp", async () => {
        const md5sum = md5(Date.now() + "");
        const regs = [
            await RegexpsModel.addRegexp(`${md5sum}1`, /[\da-fA-F]/.source),
            await RegexpsModel.addRegexp(`${md5sum}2`, /[\da-fA-F]{16}/.source),
            await RegexpsModel.addRegexp(`${md5sum}3`, /[\da-fA-F]{8}/.source)
        ];
        for (const reg of regs) {
            ids.regexps.push(reg._id);
        }
        const list = await RegexpsModel.discern(md5sum);
        list.should.be.length(0);
    });

    it("Discern from linked Regexps", async () => {
        const md5sum = md5(Date.now() + "");
        const regs = [
            await RegexpsModel.addRegexp(`${md5sum}1`, /[\da-fA-F]/.source),
            await RegexpsModel.addRegexp(`${md5sum}2`, /[\da-fA-F]{16}/.source),
            await RegexpsModel.addRegexp(`${md5sum}3`, /[\da-fA-F]{8}/.source)
        ];
        for (const reg of regs) {
            ids.regexps.push(reg._id);
            await RegexpsModel.link(reg._id, Categroy._id);
        }
        const list = await RegexpsModel.discern(md5sum);
        list.should.be.length(3);
    });

});
