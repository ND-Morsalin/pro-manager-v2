import axios from "axios";

const purchaseConfirmBySms = async ({

    mobile,
    totalAmount,
    dueAmount,
    shopName,
}:{
    mobile: string;
    totalAmount: number;
    dueAmount: number;
    shopName: string;
})=>{
// at first check if the user exists

try {
    const smsPost = await axios.get(
        `http://bulksmsbd.net/api/smsapi?api_key=Wx2YSwaq1iLCSfgn9mk2&type=text&number=88${mobile}&senderid=8809617628890&message=ProManager 
${shopName} 
পণ্য ক্রয়: ${totalAmount} ৳ 
বকেয়া: ${dueAmount} ৳
        `
      );
     console.log({
      data: smsPost.data,
  })

} catch (error) {

    console.log({
        error
    })
    
}
 
}

export default purchaseConfirmBySms;