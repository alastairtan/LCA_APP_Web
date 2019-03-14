import * as SVG from 'svg.js';

import { MaterialInput } from './MaterialInput';
import { Output } from './Output';
import { Byproduct } from './Byproduct';
import { EnergyInput } from './EnergyInput';
import { TransportationInput } from './TransportationInput';
import { DirectEmission } from './DirectEmission';


export class Connector {
    id: string;
    headIndex: number;
    index: number;
    materialInput: MaterialInput[] = [];
    outputs: Output[] = [];
    byproducts: Byproduct[] = [];
    energyInputs: EnergyInput[] = [];
    transportations: TransportationInput[] = [];
    directEmissions: DirectEmission[] = [];

    constructor(id, headIndex, index, materialInput, outputs, byproducts, energyInputs, transportations, directEmissions) {
        this.id = id;
        this.headIndex = headIndex;
        this.index = index;
        this.materialInput = materialInput;
        this.outputs = outputs;
        this.byproducts = byproducts;
        this.energyInputs = energyInputs;
        this.transportations = transportations;
        this.directEmissions = directEmissions;
    }
    equals(other: Connector) {
        var isEqual = true;
        //Compare the length of each processNode details
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
        return isEqual;
    }
}