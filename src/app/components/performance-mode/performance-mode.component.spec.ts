import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PerformanceModeComponent } from './performance-mode.component';

describe('PerformanceModeComponent', () => {
  let component: PerformanceModeComponent;
  let fixture: ComponentFixture<PerformanceModeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PerformanceModeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PerformanceModeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
