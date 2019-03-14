import { NgModule }       from '@angular/core';
import { BrowserModule }  from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule }    from '@angular/common/http';

import { AppRoutingModule }     from './app-routing.module';
import { AppComponent }         from './app.component';

import { MainMenuComponent } from './main-menu/main-menu.component';
import { CreateProjectComponent } from './create-project/create-project.component';
import { SystemBoundaryComponent } from './system-boundary/system-boundary.component';
import { ProjectFooterComponent } from './project-footer/project-footer.component';

@NgModule({
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule,
    HttpClientModule,

    // The HttpClientInMemoryWebApiModule module intercepts HTTP requests
    // and returns simulated server responses.
    // Remove it when a real server is ready to receive requests.
  ],
  declarations: [
    AppComponent,
    MainMenuComponent,
    CreateProjectComponent,
    SystemBoundaryComponent,
    ProjectFooterComponent
  ],
  bootstrap: [ AppComponent ]
})
export class AppModule { }
