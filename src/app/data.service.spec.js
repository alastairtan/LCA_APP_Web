"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var testing_1 = require("@angular/core/testing");
var data_service_1 = require("./data.service");
describe('DataService', function () {
    beforeEach(function () { return testing_1.TestBed.configureTestingModule({}); });
    it('should be created', function () {
        var service = testing_1.TestBed.get(data_service_1.DataService);
        expect(service).toBeTruthy();
    });
});
//# sourceMappingURL=data.service.spec.js.map