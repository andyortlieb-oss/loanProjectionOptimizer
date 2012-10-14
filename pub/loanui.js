
	loansetup = $("#loansetup")[0];
	addrow = $('#addrow')[0];
	fundsavail = $('#fundsavail')[0];
	loanprojections = $("#loanprojections")[0];

	loans = [];

	months=["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
	// monthoffset=(new Date()).getMonth();
	// yearoffset=(new Date()).getYear();

function roundup(num){

	return  Math.ceil( num * 100 )/100;
}

function update(id,attr){
	var val = $('#l'+id+'_'+attr)[0].value;
	//console.log("Updating, ", id, attr, val);

	loans[id][attr] = val;

	window.location.hash = "#"+JSON.stringify({loans:loans, funds:fundsavail.value });

}

function recalculate(){
	var hasBalance = true;
	var count=0;
	var reportMonth;
	var reportYear;
	var newrow;
	var html;
	var reportDateTrack = new Date();
	var myloan, myprincipal, myinterest;

	var fundsAvailable = parseFloat(fundsavail.value);
	var tmpFunds=0;
	var tmpPmt = 0;


	loanprojections.innerHTML="";

	//console.log("Hamster running on wheeel...");

	while ( hasBalance ){
		hasBalance = false;

		tmpFunds = fundsAvailable;

		reportMonth = months[reportDateTrack.getMonth()];
		reportYear = reportDateTrack.getFullYear();
		//console.log(reportMonth);
		++count;

		newrow = document.createElement('tr');
		newrow.className = 'MonthIteration'
		newrow.innerHTML = "<td colspan=6>("+count+") Month: "+reportMonth+" of "+reportYear+""
		loanprojections.appendChild(newrow);


		// Make Minimum payments
		for (var i=0; i < loans.length; ++i){
			myloan = loans[i];

			if (count===1) { // Reset our nonsense.
				myloan.total = 0;
				myloan.stashprincipal = myloan.principal;
				myloan.incline = 0;
			}


			// Shall we report on this account for this month?
			if (
					// Have we enough data?
					parseInt(myloan.principal) && parseInt(myloan.payment) &&
					// Are we paid off?
					myloan.stashprincipal>0 &&
					// Have we been increasing our balance for over 48 months?
					myloan.incline < 48

			){


				myprincipal = myloan.stashprincipal;


				myinterest = ( myprincipal * (myloan.apr/100) ) / 12;
				myinterest = roundup( myinterest );
				myloan.total+=myinterest;
				myloan.total = roundup( myloan.total );

				tmpPmt = Math.min(parseFloat(myloan.payment), tmpFunds);
				tmpFunds = tmpFunds - tmpPmt;

				myloan.stashprincipal = parseFloat(myprincipal) + parseFloat(myinterest) - parseFloat(tmpPmt);
				myloan.stashprincipal = roundup( myloan.stashprincipal );
				if (myloan.stashprincipal > myprincipal){
					myloan.incline++;
				} else {
					myloan.incline = 0;
				}

				newrow = document.createElement('tr');
				newrow.className = '';
				if (myloan.incline) newrow.className += ' incline';
				if (tmpPmt < myloan.payment) newrow.className += ' default';
				html = "<td>"+myloan.name+"</td>";
				html += "<td>"+myprincipal+"</td>";
				html += "<td>"+myloan.apr+"</td>";
				html += "<td>"+tmpPmt+"</td>";
				html += "<td>"+myinterest+"</td>";
				html += "<td>"+myloan.total+"</td>";

				newrow.innerHTML = html;
				loanprojections.appendChild(newrow);

				hasBalance = true

				// Are we free?
				if (myloan.stashprincipal <=0){
					$('#l'+i+'_freedom')[0].innerHTML = reportDateTrack.toString().split(' ').slice(0,4).join(' ');
					$('#l'+i+'_total')[0].innerHTML = myloan.total;
				}
			}
		}

		newrow = document.createElement('tr');
		newrow.innerHTML = "<td colspan=6 style='background-color:#ffa;' >"+tmpFunds+"</td>";
		loanprojections.appendChild(newrow);


		// Allocate leftover funds for extra paments
		for (var i=0; i < loans.length; ++i){
			myloan = loans[i];
		}

	}

	// Report on total interest paid overall
	var totalInterest = 0;
	for (var i =0; i< loans.length; ++i){
		console.log(totalInterest, loans[i].total)
		totalInterest += loans[i].total;
	}
	$('#rptTotalInterestPaid')[0].innerHTML = roundup(totalInterest);

	reportDateTrack.setMonth( reportDateTrack.getMonth()+1 );


}

function addloan(config){
	//console.log("adding");
	var newrow = document.createElement('tr');
	var html = "";
	var loan = {
		name:"",
		principal:"",
		apr:0.0,
		payment:0
	};
	var id = ( loans.push(loan) -1 );

	config = config || {};

	html += "<td><input type='text' id='l"+id+"_name' onchange='update("+id+",\"name\");' /></td>";
	html += "<td><input type='text' id='l"+id+"_principal' onchange='update("+id+",\"principal\");'  /></td>";
	html += "<td><input type='text' id='l"+id+"_apr' onchange='update("+id+",\"apr\");' /></td>";
	html += "<td><input type='text' id='l"+id+"_payment' onchange='update("+id+",\"payment\");' /></td>";
	html += "<td><span id='l"+id+"_freedom'>a</span></td>";
	html += "<td><span id='l"+id+"_total'>b</span></td>";


	newrow.innerHTML = html;
	loansetup.insertBefore( newrow, addrow );

	return id;

}
