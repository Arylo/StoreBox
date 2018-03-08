import { ToArrayPipe } from "@pipes/to-array";

describe("To Array Pipe Test Unit", () => {

    const fn = (value, ...properties: string[]) => {
        return new ToArrayPipe(...properties).transform(value, undefined);
    };

    it("Empty Value and Empty Property", () => {
        const value = fn(undefined);
        should(value).be.a.undefined();
    });

    it("Array and Empty Property #0", () => {
        const value = fn([ ]);
        value.should.be.eql([ ]);
    });

    it("Array and Empty Property #1", () => {
        const value = fn([ "test" ]);
        value.should.be.eql([ "test" ]);
    });

    it("Array and Empty Property #2", () => {
        const value = fn([ 123 ]);
        value.should.be.eql([ 123 ]);
    });

    it("String and Empty Property", () => {
        const value = fn("foo");
        value.should.be.an.Array().which.eql([ "foo" ]);
    });

    it("Number and Empty Property", () => {
        const value = fn(10086);
        value.should.be.an.Array().which.eql([ 10086 ]);
    });

    let OBJ;
    beforeEach(() => {
        OBJ = {
            "bar": "foo",
            "baz": [ "zoo" ]
        };
    });

    it("Object and Empty Property", () => {
        const obj: object = fn(OBJ);
        obj.should.have.properties({
            "bar": [ "foo" ],
            "baz": [ "zoo" ]
        });
    });

    it("Object and Property #0", () => {
        const obj: object = fn(OBJ, "bar");
        obj.should.have.properties({
            "bar": [ "foo" ],
            "baz": [ "zoo" ]
        });
    });

    it("Object and Property #1", () => {
        const obj: object = fn(OBJ, "baz");
        obj.should.have.properties({
            "bar": "foo",
            "baz": [ "zoo" ]
        });
    });

    it("Object and Non-exist field", () => {
        const obj: object = fn(OBJ, "foo");
        obj.should.have.properties({
            "bar": "foo",
            "baz": [ "zoo" ]
        });
    });

});
