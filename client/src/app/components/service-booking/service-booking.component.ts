import { Component, OnInit } from '@angular/core';
import { FormGroup,FormControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-service-booking',
  templateUrl: './service-booking.component.html',
  styleUrls: ['./service-booking.component.css']
})
export class ServiceBookingComponent implements OnInit {

  bookingForm = new FormGroup({
    date: new FormControl(''),
    time: new FormControl('')
  });

  constructor(private http: HttpClient,public router:Router,private route:ActivatedRoute) { }

  onSubmit() {
    console.log(this.bookingForm.value)
    if (this.bookingForm.value.date == '' || this.bookingForm.value.time == '') {
      alert ('Please select appropriate date and time.')
    } else {
      var serviceId = 0
      this.route.queryParams.subscribe(params => serviceId = params['service_id'])

      var endTime: number = +this.bookingForm.value.time.split(':')[0] + 1

      var inpObject = {
        'user_id': localStorage.getItem('id'),
        'service_id': serviceId,
        'date': this.bookingForm.value.date,
        'start_time': this.bookingForm.value.time,
        'end_time': endTime.toString() + ':' + this.bookingForm.value.time.split(':')[1]
      }
      console.log(inpObject)
    }

  }

  ngOnInit(): void { }

}
