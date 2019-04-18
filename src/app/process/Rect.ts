import { Connector } from './connector';
import { MaterialInput } from './MaterialInput';
import { Output } from './Output';
import { Byproduct } from './Byproduct';
import { EnergyInput } from './EnergyInput';
import { TransportationInput } from './TransportationInput';
import { DirectEmission } from './DirectEmission';

export class Rect {
    x;
    y;
    id;
    nextId: string[] = [];
    connectors: Connector[] = [];
    isSource: boolean;
    categories;
    processName: string;
    materialInput: MaterialInput[] = [];
    outputs: Output[] = [];
    byproducts: Byproduct[] = [];
    energyInputs: EnergyInput[] = [];
    transportations: TransportationInput[] = [];
    directEmissions: DirectEmission[] = [];
    isTarget: Boolean;

    constructor(x, y, id, nextId, connectors, isSource, categories, processName, materialInput, outputs, byproducts, energyInputs, transportations, directEmissions ) {
        this.x = x;
        this.y = y
        this.id = id;
        this.nextId = nextId;
        this.isSource = isSource;
        this.categories = categories;
        this.connectors = connectors;
        this.processName = processName;
        this.materialInput = materialInput;
        this.outputs = outputs;
        this.byproducts = byproducts;
        this.energyInputs = energyInputs;
        this.transportations = transportations;
        this.directEmissions = directEmissions;
    }

    setX(x) {
        this.x = x;
    }
  link(nextId) {
    nextId = nextId;
    }
    clearNextArrayConnect() {
        this.nextId = [];
        this.connectors = [];
    }
  getId() {
    return this.id;
    }

    setId(id) {
        this.id = id;
    }
    getX() {
        return this.x
    }

    //returns true if the connector is found
    removeConnector(id) {
        for (let i = 0; i < this.connectors.length; i++) {
            if (this.connectors[i] == id) {
                console.log('i am here');
                this.connectors.splice(i, 1);
                this.nextId.splice(i, 1);
                return true;
            }
        }
        return false;
    }

    getConnectors() {
        return this.connectors;
    }

    setConnector(index, id) {
        this.connectors[index] = id;
    }
    getY() {
        return this.y
    }

    getNext() {
        return this.nextId;
    }

    getCategories() {
        return this.categories;
    }

    equals(other: Rect) {
        var isEqual = true;
        //Compare SVG data
        isEqual = isEqual && (this.x == other.x);
        isEqual = isEqual && (this.y == other.y);
        isEqual = isEqual && (this.id == other.id);
        isEqual = isEqual && (this.categories == other.categories);
        isEqual = isEqual && (this.nextId.length == other.nextId.length);
        isEqual = isEqual && (this.connectors.length == other.connectors.length);
        isEqual = isEqual && (this.materialInput.length == other.materialInput.length);
        isEqual = isEqual && (this.outputs.length == other.outputs.length);
        isEqual = isEqual && (this.byproducts.length == other.byproducts.length);
        isEqual = isEqual && (this.energyInputs.length == other.energyInputs.length);
        isEqual = isEqual && (this.transportations.length == other.transportations.length);
        isEqual = isEqual && (this.directEmissions.length == other.directEmissions.length);
        if (!isEqual) {
            return false;
        }
        for (var i = 0; i < this.materialInput.length && isEqual; i++) {
            isEqual = isEqual && (MaterialInput.areEqual(this.materialInput[i], other.materialInput[i]));
        }
        for (var i = 0; i < this.outputs.length && isEqual; i++) {
            isEqual = isEqual && (Output.areEqual(this.outputs[i], other.outputs[i]));
        }
        for (var i = 0; i < this.byproducts.length && isEqual; i++) {
            isEqual = isEqual && (Byproduct.areEqual(this.byproducts[i], other.byproducts[i]));
        }
        for (var i = 0; i < this.energyInputs.length && isEqual; i++) {
            isEqual = isEqual && (EnergyInput.areEqual(this.energyInputs[i], other.energyInputs[i]));
        }
        for (var i = 0; i < this.transportations.length && isEqual; i++) {
            isEqual = isEqual && (TransportationInput.areEqual(this.transportations[i], other.transportations[i]));
        }
        for (var i = 0; i < this.directEmissions.length && isEqual; i++) {
            isEqual = isEqual && (DirectEmission.areEqual(this.directEmissions[i], other.directEmissions[i]));
        }
        //Compare processNode details data
        for (var i = 0; i < this.nextId.length && isEqual; i++) {
            isEqual = isEqual && (other.nextId.includes(this.nextId[i]));
        }
        for (var i = 0; i < this.connectors.length && isEqual; i++) {
            isEqual = isEqual && (other.connectors.includes(this.connectors[i]));
        }
    }
}   
