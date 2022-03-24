import { Component, OnInit } from '@angular/core';
import { FormGroup,FormControl } from '@angular/forms';

@Component({
  selector: 'app-service-booking',
  templateUrl: './service-booking.component.html',
  styleUrls: ['./service-booking.component.css']
})
export class ServiceBookingComponent implements OnInit {

  bookingForm = new FormGroup({
    name: new FormControl(''),
    email: new FormControl(''),
    gender : new FormControl(''),
    username: new FormControl(''),
    password : new FormControl(''),
    confirmPassword: new FormControl('')
  });

  constructor() { }

  onSubmit() { }

  ngOnInit(): void {
  }

}
