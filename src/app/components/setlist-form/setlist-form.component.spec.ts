import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SetlistFormComponent } from './setlist-form.component';

describe('SetlistFormComponent', () => {
  let component: SetlistFormComponent;
  let fixture: ComponentFixture<SetlistFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SetlistFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SetlistFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
