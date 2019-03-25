import { Component, HostListener, OnInit, ChangeDetectorRef } from '@angular/core';
import { DataService } from "../data.service";
import { Router } from '@angular/router';

import { Project } from '../project';

@Component({
    selector: 'app-result',
    templateUrl: './result.component.html',
    styleUrls: ['./result.component.css']
})

export class ResultComponent implements OnInit {
    
    project: Project = this.dataService.getProject();           //Object containing all data of the current project
    lastSaved = '';                         //Placeholder to notify users of the time of the last saved project
    results = [];
    metadata = {
        arrowCount: 0,
        arrowNames: [],
        entities: [],
        entityIndexMap: {}
    };
    aggregateCount = [];

    constructor(private dataService: DataService,
                private router: Router,
                private cd: ChangeDetectorRef) { }

    ngOnInit() {
    }

}
