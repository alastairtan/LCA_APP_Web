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
export class ProjectFooterComponent {
    array = [[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12], [13, 14, 15, 16]];
    hoveredRow = null;
    hoveredCol = null;

    mouseOverCell(row, col) {
        this.hoveredRow = row;
        this.hoveredCol = col;
    }
}
