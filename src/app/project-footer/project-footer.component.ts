import { Component, OnInit } from '@angular/core';
import { DataService } from "../data.service";
import { Project } from "../project"

@Component({
  selector: 'app-project-footer',
  templateUrl: './project-footer.component.html',
  styleUrls: ['./project-footer.component.css']
})
export class ProjectFooterComponent implements OnInit {

    data = "empty";

    constructor(private dataService: DataService) { }

    ngOnInit() {
        var p = JSON.parse('{ "name":"John", "age":30, "city":"New York"}');
        p['newField'] = "what";

        for (var key in p) {
            if (p.hasOwnProperty(key)) {
                console.log(key + " -> " + p[key]);
            }
        }
    }
}
