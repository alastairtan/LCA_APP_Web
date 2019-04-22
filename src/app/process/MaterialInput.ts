import { isEmbeddedView } from "@angular/core/src/view/util";

export class MaterialInput {
    materialName: string;
    from: string[];
    quantity: string;
    unit: string;
    carbonStorage: string;
    activityDataOrigin: string;
    emissionFactorData: string;
    emissionFactorSource: string;
    remarks: string; 
    isCollapsed: boolean;

    constructor() {
        this.materialName = '';
        this.from = [''];
        this.quantity = '0';
        this.unit = 'm3';
        this.carbonStorage = '';
        this.activityDataOrigin = '';
        this.emissionFactorData = '';
        this.emissionFactorSource = '';
        this.remarks = 'N/A';
        this.isCollapsed = false;
    }

    parseData(jsonObj) {
        this.materialName = jsonObj.materialName;
        this.from = jsonObj.from;
        this.quantity = jsonObj.quantity;
        this.unit = jsonObj.unit;
        this.carbonStorage = jsonObj.carbonStorage;
        this.activityDataOrigin = jsonObj.activityDataOrigin;
        this.emissionFactorData = jsonObj.emissionFactorData;
        this.emissionFactorSource = jsonObj.emissionFactorSource;
        this.remarks = jsonObj.remarks;
        this.isCollapsed = jsonObj.isCollapsed;
    }

    equals(other: MaterialInput) {
        var isEqual = true;
        isEqual = isEqual && (this.materialName == other.materialName);
        if (other.from.length != this.from.length) {
            return false;
        }
        for (let i = 0; i < other.from.length && i < this.from.length; i++) {
            if (this.from[i] != other.from[i]) {
                isEqual = false;
            }
        }
        isEqual = isEqual && (this.quantity == other.quantity);
        isEqual = isEqual && (this.unit == other.unit);
        isEqual = isEqual && (this.carbonStorage == other.carbonStorage);
        isEqual = isEqual && (this.activityDataOrigin == other.activityDataOrigin);
        isEqual = isEqual && (this.emissionFactorData == other.emissionFactorData);
        isEqual = isEqual && (this.emissionFactorSource == other.emissionFactorSource);
        isEqual = isEqual && (this.remarks == other.remarks);
        return isEqual;
    }

    static areEqual(thisInput: MaterialInput, thatInput: MaterialInput) {
        var isEqual = true;
        isEqual = isEqual && (thisInput.materialName == thatInput.materialName);
        for (let i = 0; i < thisInput.from.length; i++) {
            if (thisInput.from[i] != thatInput.from[i]) {
                isEqual = false;
            }
        }
        isEqual = isEqual && (thisInput.quantity == thatInput.quantity);
        isEqual = isEqual && (thisInput.unit == thatInput.unit);
        isEqual = isEqual && (thisInput.carbonStorage == thatInput.carbonStorage);
        isEqual = isEqual && (thisInput.activityDataOrigin == thatInput.activityDataOrigin);
        isEqual = isEqual && (thisInput.emissionFactorData == thatInput.emissionFactorData);
        isEqual = isEqual && (thisInput.emissionFactorSource == thatInput.emissionFactorSource);
        isEqual = isEqual && (thisInput.remarks == thatInput.remarks);
        return isEqual;
    }
}
