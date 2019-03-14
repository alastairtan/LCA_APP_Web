export class MaterialInput {
    materialName: string;
    quantity: string;
    unit: string;
    carbonStorage: string;
    activityDataOrigin: string;
    emissionDataOrigin: string;
    emissionFactorData: string;
    emissionFactorSource: string;
    remarks: string; 

    constructor() {
        this.materialName = '';
        this.quantity = '0';
        this.unit = '';
        this.carbonStorage = '';
        this.activityDataOrigin = '';
        this.emissionDataOrigin = '';
        this.emissionFactorData = '';
        this.emissionFactorSource = '';
        this.remarks = 'N/A';
    }

    equals(other: MaterialInput) {
        var isEqual = true;
        isEqual = isEqual && (this.materialName == other.materialName);
        isEqual = isEqual && (this.quantity == other.quantity);
        isEqual = isEqual && (this.unit == other.unit);
        isEqual = isEqual && (this.carbonStorage == other.carbonStorage);
        isEqual = isEqual && (this.activityDataOrigin == other.activityDataOrigin);
        isEqual = isEqual && (this.emissionDataOrigin == other.emissionDataOrigin);
        isEqual = isEqual && (this.emissionFactorData == other.emissionFactorData);
        isEqual = isEqual && (this.emissionFactorSource == other.emissionFactorSource);
        isEqual = isEqual && (this.remarks == other.remarks);
        return isEqual;
    }

    static areEqual(thisInput: MaterialInput, thatInput: MaterialInput) {
        var isEqual = true;
        isEqual = isEqual && (thisInput.materialName == thatInput.materialName);
        isEqual = isEqual && (thisInput.quantity == thatInput.quantity);
        isEqual = isEqual && (thisInput.unit == thatInput.unit);
        isEqual = isEqual && (thisInput.carbonStorage == thatInput.carbonStorage);
        isEqual = isEqual && (thisInput.activityDataOrigin == thatInput.activityDataOrigin);
        isEqual = isEqual && (thisInput.emissionDataOrigin == thatInput.emissionDataOrigin);
        isEqual = isEqual && (thisInput.emissionFactorData == thatInput.emissionFactorData);
        isEqual = isEqual && (thisInput.emissionFactorSource == thatInput.emissionFactorSource);
        isEqual = isEqual && (thisInput.remarks == thatInput.remarks);
        return isEqual;
    }
}
