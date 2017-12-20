import * as db from "../helpers/database";
import * as md5 from "md5";
import * as Rx from "rxjs";
import { Model as RegExpModel } from "@models/RegExp";
import { Model as CategroyModel } from "@models/Categroy";
import { Subject } from "rxjs";

describe("RegExp Model", () => {

    const Categroy = {
        name: `cate_${Date.now()}`,
        id: ""
    };

    before(() => {
        db.connect();
    });

    before(() => {
        return CategroyModel.create({ name: Categroy.name}).then((result) => {
            Categroy.id = result._id;
        });
    });

    after(() => {
        CategroyModel.findByIdAndRemove(Categroy.id).exec();
    });

    it("No link Regexp", (done) => {
        const noticer = new Subject();
        noticer.subscribe({
            next: (ids: any[]) => {
                ids.forEach((id) => {
                    RegExpModel.findByIdAndRemove(id).exec();
                });
            },
            complete: done
        });
        const md5sum = md5(Date.now() + "");
        Promise.all([
            RegExpModel.addRegexp(`${md5sum}1`, /[\da-fA-F]/.source),
            RegExpModel.addRegexp(`${md5sum}2`, /[\da-fA-F]{16}/.source),
            RegExpModel.addRegexp(`${md5sum}3`, /[\da-fA-F]{8}/.source)
        ]).then((regs) => {
            return RegExpModel.discern(md5sum).then((results) => {
                results.should.be.length(0);
                const ids = regs.map((item) => {
                    return item.toObject()._id;
                });
                noticer.next(ids);
                noticer.complete();
            });
        });
    });

});
