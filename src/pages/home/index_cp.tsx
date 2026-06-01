import ab_logo from '../../assets/images/ab_logo.png'
import ab_header from '../../assets/images/ab_header.jpeg'
import { BookOutlined, CameraOutlined, DownCircleOutlined, DownloadOutlined, FireOutlined, FormatPainterOutlined, FundProjectionScreenOutlined, LinkOutlined, MenuOutlined, PaperClipOutlined, PlayCircleFilled, SendOutlined, TeamOutlined, ThunderboltOutlined, WechatWorkOutlined } from '@ant-design/icons';

function Home() {
  return (
    <div>
      <header
        className="relative h-[60vh] bg-cover bg-center text-white"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.9), rgba(0,0,0,0.2)), url('${ab_header}')`,
        }}
      >
        <div className='flex flex-row justify-between px-20 items-center bg-[linear-gradient(to_bottom,rgba(0,0,0,0.9),transparent)] '>
            <div className="h-30 w-30 mt-10 ml-20 bg-no-repeat bg-center bg-contain invert brightness-0" style={{
                backgroundImage: `url('${ab_logo}')`
            }}></div>
            <a
              href="https://play.google.com/store/apps/details?id=com.mcshelton.mobile_v1&pcampaignid=web_share"
              target="_blank"
              rel="noopener noreferrer"
              className='text-white self-end  text-xs font-bold rounded-full border-white border-1 w-fit px-6 py-2'
            >
              Download App
            </a>
        </div>
        {/* <nav className='text-white flex float-right gap-3 mr-20 text-sm mt-3 hover:cursor-pointer'>
            <div>Home</div>
            <div>About</div>
            <div>Teams</div>
            <div>Badges</div>
        </nav> */}
        <div className='mt-25 ml-40'>
            <div className='flex gap-2 text-xl'>
            <PlayCircleFilled />
            <p>Learn About AdventBand .Org</p>
            </div>
            <h1 className='text-5xl font-bold max-w-[50vw] my-5'>Join A Team Of Adventist Missionaries To Spread The 3 Angels' Message</h1>
            <div className='flex bg-white rounded-full justify-between w-[30vw] p-1'>
                <input type='email' alt='enter email address' className='outline-0 w-[80%] px-5 text-black' placeholder='example@gmail.com'/>
                <div className='flex py-3 px-5 bg-amber-600 rounded-full gap-5'>
                <SendOutlined/>
                <div>Submit</div>
                </div>
            </div>
            <div className='mt-3 flex gap-3 hover:cursor-pointer'>
                <p className='rounded-full w-fit px-3 py-2 text-sm'>Places to get started :</p>
                <p className='rounded-full border-1 w-fit px-3 py-2 text-sm'>Our Teams</p>
                <p className='rounded-full border-1 w-fit px-3 py-2 text-sm'>Team walls & Badges</p>
                <p className='rounded-full border-1 w-fit px-3 py-2 text-sm'>About Us</p>
            </div>
        </div>
      </header>
      <section className='flex bg-[#3a190b] h-110 text-white p-10 justify-center gap-10'>
        <div className=' bg-[#3a2217] p-5 w-[18%] rounded-2xl'>
            <div className='px-5 h-15 w-15 bg-[#39281f] flex justify-center rounded-full'>
                <DownCircleOutlined/>
            </div>
            <p className='text-sm my-5   mt-20 text-center'>Download Advent Band App</p>
            <div className='flex flex-col justify-center items-center border-1 rounded-2xl py-5'>
                <DownloadOutlined/>
                <a
                  href="https://play.google.com/store/apps/details?id=com.mcshelton.mobile_v1&pcampaignid=web_share"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Download App
                </a>
            </div>
        </div>
        <div className=' bg-[#3a2217] p-5 w-[18%] rounded-2xl'>
            <div className='px-5 h-15 w-15 bg-[#39281f] flex justify-center rounded-full'>
                <TeamOutlined/>
            </div>
            <h6 className='font-bold my-5 text-2xl'>Transforming Lives Through Spiritual Engagement</h6>
            <p className='text-sm'>Our core mission is to minister with impact—within and beyond our organization. This pillar
            centers on intentional spiritual outreach and inward spiritual growth.</p>
        </div>
        <div className=' bg-[#3a2217] p-5 w-[18%] rounded-2xl'>
            <div className='px-5 h-15 w-15 bg-[#39281f] flex justify-center rounded-full'>
                <MenuOutlined/>
            </div>
            <h6 className='font-bold my-5 text-2xl'>Expanding Impact Through Strategic Alliances and Structure</h6>
            <p className='text-sm'>We are committed to forging partnerships and building organizational structures that
            empower sustainable growth and amplify our influence. </p>
        </div>
        <div className=' bg-[#3a2217] p-5 w-[18%] rounded-2xl'>
            <div className='px-5 h-15 w-15 bg-[#39281f] flex justify-center rounded-full'>
                <LinkOutlined/>
            </div>
            <h6 className='font-bold my-5 text-2xl'>Cultivating a Thriving Community of Purpose</h6>
            <p className='text-sm'>We believe that people are the heartbeat of our mission. This pillar focuses on building
            strong, collaborative teams anchored in love, belonging, and shared purpose.</p>
        </div>
      </section>
      <section className='p-40'>
        <h1 className='text-5xl max-w-240'>Explore multiple opportunities to engage in volunteering work</h1>
        <div className='flex gap-4'>
            <p><span className='text-amber-600 border-1 rounded-full px-3 text-sm mr-2'>2+ </span>  Applications</p>
            <p><span className='text-amber-600 border-1 rounded-full px-3 text-sm mr-2'>20+ </span>  Volunteers</p>
            <p><span className='text-amber-600 border-1 rounded-full px-3 text-sm mr-2'>7+  </span> Avenues</p>
            <p><span className='text-amber-600 border-1 rounded-full px-3 text-sm mr-2'>10+ </span>  Ministries</p>
        </div>
        <div className='flex flex-row overflow-scroll mt-30 gap-10'>
            <div className='rounded-full h-30 w-40 border-1 border-gray-300 flex flex-col justify-center items-center'>
                <FundProjectionScreenOutlined className='font-bold text-5xl'/>
                <p className='text-xs'>Front-End Dev</p>
            </div>
            <div className='rounded-full h-30 w-40 border-1 border-gray-300 flex flex-col justify-center items-center'>
                <FormatPainterOutlined className='font-bold text-5xl'/>
                <p className='text-xs'>A/B Writer</p>
            </div>
            <div className='rounded-full h-30 w-40 border-1 border-gray-300 flex flex-col justify-center items-center'>
                <PaperClipOutlined className='font-bold text-5xl'/>
                <p className='text-xs'>Evangelist</p>
            </div>
            <div className='rounded-full h-30 w-40 border-1 border-gray-300 flex flex-col justify-center items-center'>
                <WechatWorkOutlined className='font-bold text-5xl'/>
                <p className='text-xs'>Missionary</p>
            </div>
            <div className='rounded-full h-30 w-40 border-1 border-gray-300 flex flex-col justify-center items-center'>
                <FireOutlined className='font-bold text-5xl'/>
                <p className='text-xs'>Back-End Dev</p>
            </div>
            <div className='rounded-full h-30 w-40 border-1 border-gray-300 flex flex-col justify-center items-center'>
                <BookOutlined className='font-bold text-5xl'/>
                <p className='text-xs'>Colporter</p>
            </div>
            <div className='rounded-full h-30 w-40 border-1 border-gray-300 flex flex-col justify-center items-center'>
                <ThunderboltOutlined className='font-bold text-5xl'/>
                <p className='text-xs'>Events</p>
            </div>

            <div className='rounded-full h-30 w-40 border-1 border-gray-300 flex flex-col justify-center items-center'>
                <CameraOutlined className='font-bold text-5xl'/>
                <p className='text-xs'>Media</p>
            </div>
            
        </div>
      </section>
    </div>
  );
}

export default Home;
