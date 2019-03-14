import { NgModule }             from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { MainMenuComponent }   from './main-menu/main-menu.component';
import { CreateProjectComponent } from './create-project/create-project.component';
import { SystemBoundaryComponent } from './system-boundary/system-boundary.component';
import { ProjectFooterComponent } from './project-footer/project-footer.component';

const routes: Routes = [
  { path: '', redirectTo: '/mainMenu', pathMatch: 'full' },
  { path: 'mainMenu', component: MainMenuComponent },
  { path: 'createProject', component: CreateProjectComponent },
  { path: 'systemBoundary', component: SystemBoundaryComponent },
  { path: 'projectFooter', component: ProjectFooterComponent }
];

@NgModule({
  imports: [ RouterModule.forRoot(routes) ],
  exports: [ RouterModule ]
})
export class AppRoutingModule {}
