import { Component, OnInit } from '@angular/core';
import { DataService } from "../data.service";
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
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

    movies = [
        'Episode I - The Phantom Menace',
        'Episode II - Attack of the Clones',
        'Episode III - Revenge of the Sith',
        'Episode IV - A New Hope',
        'Episode V - The Empire Strikes Back',
        'Episode VI - Return of the Jedi',
        'Episode VII - The Force Awakens',
        'Episode VIII - The Last Jedi'
    ];

    drop(event: CdkDragDrop<string[]>) {
        moveItemInArray(this.movies, event.previousIndex, event.currentIndex);
    }
}
