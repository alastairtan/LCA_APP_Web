import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SystemBoundaryComponent } from './system-boundary.component';

describe('SystemBoundaryComponent', () => {
  let component: SystemBoundaryComponent;
  let fixture: ComponentFixture<SystemBoundaryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SystemBoundaryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SystemBoundaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
