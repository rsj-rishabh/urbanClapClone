import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router'
import { GlobalConstants } from 'src/app/common/global-constants';
import { flatMap } from 'rxjs';

@Component({
  selector: 'app-bookings',
  templateUrl: './bookings.component.html',
  styleUrls: ['./bookings.component.css']
})
export class BookingsComponent implements OnInit {

  myBookingsData = [];
  myBookingsName:string[] = [];
  myBookingsDesc:string[] = [];

  cancelledBookingsData = [];
  cancelledBookingsName:string[] = [];
  cancelledBookingsDesc:string[] = [];

  imageURL = GlobalConstants.imageURL;

  constructor(private http: HttpClient, public router:Router) { }

  getServiceName(id:number, cancel:boolean) {
    this.http.get<any>(GlobalConstants.apiURL+'getServiceInfo?serviceId='+id)
      .subscribe(data => {
        if (cancel) {
          this.cancelledBookingsName.push( data.name );
        } else {
          this.myBookingsName.push( data.name );
        }
      }
    )
  }

  getServiceDescription(id:number, cancel:boolean) {
    this.http.get<any>(GlobalConstants.apiURL+'getServiceInfo?serviceId='+id)
      .subscribe(data => {
        if (cancel) {
          this.cancelledBookingsDesc.push( data.name );
        } else {
          this.myBookingsDesc.push( data.name );
        }
      }
    )
  }

  cancelBooking(bookingId:number) {
    this.http.get<any>(GlobalConstants.apiURL+'cancelBooking?id='+bookingId)
      .subscribe(data => {
        console.log(data)
        confirm('Service cancelled! :-(\nHope to see you again.')
        this.router.navigate(['/bookings']).then(() => {
          window.location.reload();
        });
      },
      err => {
        alert(err)
      }
    )
  }

  ngOnInit(): void {
    this.http.get<any>(GlobalConstants.apiURL+'getBookings?userId='+localStorage.getItem('id'))
      .subscribe(data => {
        console.log("-----------------/ Current Bookings /-----------------")
        console.log(data);
        
        for (let i=0; i<data.length; i++) {
          this.getServiceName(data[i]['service_id'], false);
          this.getServiceDescription(data[i]['service_id'], false);
        }

        console.log(this.myBookingsName);
        console.log(this.myBookingsDesc);

        this.myBookingsData = data;

      }
    )

    this.http.get<any>(GlobalConstants.apiURL+'getCancelledBookings?userId='+localStorage.getItem('id'))
      .subscribe(data => {
        console.log("-----------------/ Cancelled Bookings /-----------------")
        console.log(data);
        
        for (let i=0; i<data.length; i++) {
          this.getServiceName(data[i]['service_id'], true);
          this.getServiceDescription(data[i]['service_id'], true);
        }

        console.log(this.cancelledBookingsName);
        console.log(this.cancelledBookingsDesc);

        this.cancelledBookingsData = data;

      }
    )

    
  }

}
