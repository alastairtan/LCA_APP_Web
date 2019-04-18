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

    ngOnInit(): void {
        this.doStuff();
    }

    constructor(private dataService: DataService, private fb: FormBuilder) { }

    obj = {
        materialName: "R1",
        from: ['R1'],
        quantity: 1,
    }
    array = [[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12], [13, 14, 15, 16]];
    hoveredRow = null;
    hoveredCol = null;

    mouseOverCell(row, col) {
        this.hoveredRow = row;
        this.hoveredCol = col;
    }

    doStuff() {
        var form = this.fb.group(this.transformForFormBuilder(this.obj));
        console.log(form.value);
    }

    private transformForFormBuilder(obj) {
        var clone = JSON.parse(JSON.stringify(obj));
        for (var property in clone) {
            if (clone.hasOwnProperty(property) && Array.isArray(clone[property])) {
                clone[property] = this.fb.array(clone[property]);
            }
        }
        return clone;
    }
}
