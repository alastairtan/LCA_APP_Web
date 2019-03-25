import { NgModule }       from '@angular/core';
import { BrowserModule }  from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { DragDropModule } from '@angular/cdk/drag-drop'

import { AppRoutingModule }     from './app-routing.module';
import { AppComponent }         from './app.component';

import { MainMenuComponent } from './main-menu/main-menu.component';
import { CreateProjectComponent } from './create-project/create-project.component';
import { SystemBoundaryComponent } from './system-boundary/system-boundary.component';
import { ProcessComponent, Dialog } from './process/process.component';
import { SidebarDirective } from './process/sidebar.directive';
import { ResultComponent } from './result/result.component';
import { ProjectFooterComponent } from './project-footer/project-footer.component';
import { MatSidenavModule, MatDialogModule, MAT_DIALOG_DEFAULT_OPTIONS } from '@angular/material';
import { MatToolbarModule } from '@angular/material/toolbar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CookieService } from 'ngx-cookie-service';
import { DialogComponent } from './dialog/dialog.component'

@NgModule({
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule,
    HttpClientModule,
      DragDropModule,
      MatSidenavModule,
      BrowserAnimationsModule,
      MatToolbarModule,
      MatDialogModule
  ],
  declarations: [
    AppComponent,
    MainMenuComponent,
    CreateProjectComponent,
    SystemBoundaryComponent,
    ProcessComponent,
    SidebarDirective,
    ResultComponent,
    ProjectFooterComponent,
      DialogComponent,
      Dialog
  ],
    bootstrap: [AppComponent],
    providers: [CookieService,
        { provide: MAT_DIALOG_DEFAULT_OPTIONS, useValue: { hasBackdrop: false } }],
    entryComponents: [Dialog]
})
export class AppModule { }
