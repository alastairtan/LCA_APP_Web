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
}
