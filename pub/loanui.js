
	loansetup = $("#loansetup")[0];
	addrow = $('#addrow')[0];
	incomeavail = $('#incomeavail')[0];
	loanprojections = $("#loanprojections")[0];

	loans = [];

	months=["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
	// monthoffset=(new Date()).getMonth();
	// yearoffset=(new Date()).getYear();

function update(id,attr){
	var val = $('#l'+id+'_'+attr)[0].value;
	console.log("Updating, ", id, attr, val);

	loans[id][attr] = val;
	recalculate();

	window.location.hash = "#"+JSON.stringify(loans);

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


	loanprojections.innerHTML="";

	console.log("Hamster running on wheeel...");

	while ( hasBalance ){
		hasBalance = false;

		reportMonth = months[reportDateTrack.getMonth()];
		reportYear = reportDateTrack.getFullYear();
		console.log(reportMonth);
		++count;

		newrow = document.createElement('tr');
		newrow.className = 'MonthIteration'
		newrow.innerHTML = "<td colspan=6>("+count+") Month: "+reportMonth+" of "+reportYear+""
		loanprojections.appendChild(newrow);

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
				myinterest = Math.ceil( myinterest * 100 )/100;
				myloan.total+=myinterest;

				myloan.stashprincipal = parseFloat(myprincipal) + parseFloat(myinterest) - parseFloat(myloan.payment);
				if (myloan.stashprincipal > myprincipal){
					myloan.incline++;
				} else {
					myloan.incline = 0;
				}

				newrow = document.createElement('tr');
				if (myloan.incline) newrow.className = 'incline';
				html = "<td>"+myloan.name+"</td>";
				html += "<td>"+myprincipal+"</td>";
				html += "<td>"+myloan.apr+"</td>";
				html += "<td>"+myloan.payment+"</td>";
				html += "<td>"+myinterest+"</td>";
				html += "<td>"+myloan.total+"</td>";

				newrow.innerHTML = html;
				loanprojections.appendChild(newrow);

				hasBalance = true
			}
		}

		reportDateTrack.setMonth( reportDateTrack.getMonth()+1 );


	}

}

function addloan(config){
	console.log("adding");
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
	//html += "<td><span id='l"+id+"_cinterest'>a</span></td>";
	//html += "<td><span id='l"+id+"_tinterest'>b</span></td>";
	html += "<td colspan=2>&nbsp;</td>"

	newrow.innerHTML = html;
	loansetup.insertBefore( newrow, addrow );

	return id;

}
