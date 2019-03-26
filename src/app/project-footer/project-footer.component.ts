import { Component, OnInit } from '@angular/core';
import { DataService } from "../data.service";
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Project } from "../project"
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-project-footer',
  templateUrl: './project-footer.component.html',
  styleUrls: ['./project-footer.component.css']
})
export class ProjectFooterComponent implements OnInit {

    form1: FormGroup; form2: FormGroup; form3: FormGroup; form4: FormGroup; form5: FormGroup; form6: FormGroup;
    list1: FormArray; list2: FormArray; list3: FormArray; list4: FormArray; list5: FormArray; list6: FormArray; 

    inputMenuBar = ['Material', 'Energy', 'Transport'];
    outputMenuBar = ['Output', 'Byproduct', 'Others'];
    selectedTab = this.inputMenuBar[0];


    constructor(private fb: FormBuilder) { }

    ngOnInit() {
        this.form1 = this.createEmptyForm();
        this.list1 = this.form1.get('inputs') as FormArray;
        this.form2 = this.createEmptyForm();
        this.list2 = this.form2.get('inputs') as FormArray;
        this.form3 = this.createEmptyForm();
        this.list3 = this.form3.get('inputs') as FormArray;
        this.form4 = this.createEmptyForm();
        this.list4 = this.form4.get('inputs') as FormArray;
        this.form5 = this.createEmptyForm();
        this.list5 = this.form5.get('inputs') as FormArray;
        this.form6 = this.createEmptyForm();
        this.list6 = this.form6.get('inputs') as FormArray;
    }

    createEmptyForm(): FormGroup {
        return this.fb.group({
            name: [null, Validators.compose([Validators.required])], //process name
            inputs: this.fb.array([this.createEmptyInput()])
        });
    }

    // input formgroup
    createEmptyInput(): FormGroup {
        return this.fb.group({
            type: [null],
            quantity: [null],
            unit: [null],
            dataOrigin: [null],
            remarks: [null],
        });
    }

    get inputs1FormGroup() {
        return this.form1.get('inputs') as FormArray;
    }

    get inputs2FormGroup() {
        return this.form2.get('inputs') as FormArray;
    }

    // add a contact form group
    addInput(list: FormArray) {
        list.push(this.createEmptyInput());
    }

    // remove contact from group
    removeInput(list:FormArray, index:number) {
        // this.contactList = this.form.get('contacts') as FormArray;
        list.removeAt(index);
    }

    // get the formgroup under contacts form array
    getInputsFormGroup(list:FormArray, index:number): FormGroup {
        // this.contactList = this.form.get('contacts') as FormArray;
        const formGroup = list.controls[index] as FormGroup;
        return formGroup;
    }

    // method triggered when form is submitted
    submit(form: FormGroup) {
        console.log({
            material: this.form1.value,
            energy: this.form2.value
        });
    }
}
